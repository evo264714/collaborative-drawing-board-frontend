import React, { useRef, useEffect, useState } from "react";
import io from "socket.io-client";
import Swal from "sweetalert2";
import { useNavigate } from "react-router-dom";
import { v4 as uuidv4 } from "uuid";

const socket = io("https://collaborative-drawing-board-backend.onrender.com");

const Board = ({ boardId }) => {
  const canvasRef = useRef(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [tool, setTool] = useState("pencil");
  const [color, setColor] = useState("#000000");
  const [fontSize, setFontSize] = useState(20);
  const [startPosition, setStartPosition] = useState(null);
  const [elements, setElements] = useState([]);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchBoard = async () => {
      if (!boardId) return;

      try {
        socket.emit("join", boardId);
        socket.on("loadBoard", (loadedElements) => {
          setElements(loadedElements);
          redrawCanvas(loadedElements);
        });
      } catch (error) {
        console.error("Error fetching board:", error);
      }
    };

    fetchBoard();

    return () => {
      socket.off("loadBoard");
    };
  }, [boardId]);

  const drawElement = (ctx, element) => {
    if (element.tool === "pencil") {
      ctx.beginPath();
      ctx.moveTo(element.startX, element.startY);
      ctx.lineTo(element.endX, element.endY);
      ctx.strokeStyle = element.color;
      ctx.lineWidth = 2;
      ctx.stroke();
    } else if (element.tool === "eraser") {
      ctx.clearRect(element.x - 5, element.y - 5, 10, 10);
    } else if (element.tool === "text") {
      ctx.font = `${element.fontSize}px Arial`;
      ctx.fillStyle = element.color;
      ctx.fillText(element.text, element.x, element.y);
    } else if (element.tool === "rectangle") {
      ctx.strokeStyle = element.color;
      ctx.lineWidth = 2;
      ctx.strokeRect(
        element.startX,
        element.startY,
        element.width,
        element.height
      );
    } else if (element.tool === "circle") {
      ctx.strokeStyle = element.color;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(element.startX, element.startY, element.radius, 0, 2 * Math.PI);
      ctx.stroke();
    }
  };

  const redrawCanvas = (elements) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = "white"; // Ensure the canvas is filled with white color
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    elements.forEach((element) => drawElement(ctx, element));
  };

  const handleErase = (e, ctx) => {
    const rect = canvasRef.current.getBoundingClientRect();
    const offsetX = e.clientX - rect.left;
    const offsetY = e.clientY - rect.top;

    // Find the element to erase by matching coordinates
    const elementToErase = elements.find((el) => {
      if (el.tool === "pencil") {
        return (
          Math.abs(el.startX - offsetX) < 10 &&
          Math.abs(el.startY - offsetY) < 10
        );
      } else if (el.tool === "rectangle") {
        return (
          offsetX >= el.startX &&
          offsetX <= el.startX + el.width &&
          offsetY >= el.startY &&
          offsetY <= el.startY + el.height
        );
      } else if (el.tool === "circle") {
        const distance = Math.sqrt(
          Math.pow(offsetX - el.startX, 2) + Math.pow(offsetY - el.startY, 2)
        );
        return distance <= el.radius;
      } else if (el.tool === "text") {
        const textWidth = ctx.measureText(el.text).width;
        return (
          offsetX >= el.x &&
          offsetX <= el.x + textWidth &&
          offsetY >= el.y - el.fontSize &&
          offsetY <= el.y
        );
      }
      return false;
    });

    if (elementToErase) {
      socket.emit("erase", { boardId, element: elementToErase });
      setElements((prev) => prev.filter((el) => el.id !== elementToErase.id));
      redrawCanvas(elements.filter((el) => el.id !== elementToErase.id));
    }
  };

  useEffect(() => {
    if (!boardId) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    ctx.lineJoin = "round";
    ctx.lineCap = "round";

    const handleMouseDown = (e) => {
      const rect = canvas.getBoundingClientRect();
      const offsetX = e.clientX - rect.left;
      const offsetY = e.clientY - rect.top;
      setStartPosition({ x: offsetX, y: offsetY });

      const newElement = {
        id: uuidv4(),
        startX: offsetX,
        startY: offsetY,
        endX: offsetX,
        endY: offsetX,
        tool,
        color,
      };

      if (tool === "text") {
        Swal.fire({
          title: "Enter your text",
          input: "text",
          showCancelButton: true,
        }).then((result) => {
          if (result.isConfirmed) {
            const newElement = {
              id: uuidv4(),
              x: offsetX,
              y: offsetY,
              tool: "text",
              color,
              text: result.value,
              fontSize,
            };
            setElements((prev) => [...prev, newElement]);
            drawElement(ctx, newElement);
            socket.emit("drawing", { boardId, element: newElement });
          }
        });
        return;
      }

      setIsDrawing(true);
      if (tool === "pencil") {
        ctx.beginPath();
        ctx.moveTo(offsetX, offsetY);
        socket.emit("drawing", { boardId, element: newElement });
      } else if (tool === "eraser") {
        handleErase(e, ctx); // Pass ctx to handleErase
      }
    };

    const handleMouseMove = (e) => {
      if (!isDrawing) return;
      const rect = canvas.getBoundingClientRect();
      const offsetX = e.clientX - rect.left;
      const offsetY = e.clientY - rect.top;

      if (tool === "pencil") {
        ctx.lineTo(offsetX, offsetY);
        ctx.strokeStyle = color;
        ctx.lineWidth = 2;
        ctx.stroke();
        const newElement = {
          id: uuidv4(),
          startX: startPosition.x,
          startY: startPosition.y,
          endX: offsetX,
          endY: offsetY,
          tool,
          color,
        };
        setElements((prev) => [...prev, newElement]);
        socket.emit("drawing", { boardId, element: newElement });
        setStartPosition({ x: offsetX, y: offsetY });
      } else if (tool === "eraser") {
        handleErase(e, ctx); // Handle erasing with ctx
      } else if (tool === "rectangle" || tool === "circle") {
        redrawCanvas(elements);
        const width = offsetX - startPosition.x;
        const height = offsetY - startPosition.y;

        if (tool === "rectangle") {
          ctx.strokeStyle = color;
          ctx.lineWidth = 2;
          ctx.strokeRect(startPosition.x, startPosition.y, width, height);
        } else if (tool === "circle") {
          ctx.strokeStyle = color;
          ctx.lineWidth = 2;
          ctx.beginPath();
          const radius = Math.sqrt(width * width + height * height);
          ctx.arc(startPosition.x, startPosition.y, radius, 0, 2 * Math.PI);
          ctx.stroke();
        }
      }
    };

    const handleMouseUp = (e) => {
      if (!isDrawing) return;
      setIsDrawing(false);
      const rect = canvas.getBoundingClientRect();
      const offsetX = e.clientX - rect.left;
      const offsetY = e.clientY - rect.top;

      if (tool === "rectangle" || tool === "circle") {
        const width = offsetX - startPosition.x;
        const height = offsetY - startPosition.y;
        const radius = Math.sqrt(width * width + height * height);

        const newElement = {
          id: uuidv4(),
          startX: startPosition.x,
          startY: startPosition.y,
          endX: offsetX,
          endY: offsetY,
          width,
          height,
          radius,
          tool,
          color,
        };

        setElements((prev) => [...prev, newElement]);
        socket.emit("drawing", { boardId, element: newElement });
      }
    };

    canvas.addEventListener("mousedown", handleMouseDown);
    canvas.addEventListener("mousemove", handleMouseMove);
    canvas.addEventListener("mouseup", handleMouseUp);

    socket.on("drawing", (data) => {
      if (data.boardId === boardId) {
        setElements((prevElements) => [...prevElements, data.element]);
        drawElement(ctx, data.element);
      }
    });

    socket.on("erase", (data) => {
      if (data.boardId === boardId) {
        setElements((prev) => prev.filter((el) => el.id !== data.element.id));
        redrawCanvas(elements.filter((el) => el.id !== data.element.id));
      }
    });

    return () => {
      canvas.removeEventListener("mousedown", handleMouseDown);
      canvas.removeEventListener("mousemove", handleMouseMove);
      canvas.removeEventListener("mouseup", handleMouseUp);
      socket.off("drawing");
      socket.off("erase");
    };
  }, [boardId, isDrawing, tool, color, elements, fontSize]);

  const resizeCanvas = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const parent = canvas.parentElement;
    if (!parent) return;
    canvas.width = parent.clientWidth;
    canvas.height = parent.clientHeight;
    redrawCanvas(elements);
  };

  useEffect(() => {
    resizeCanvas();
    window.addEventListener("resize", resizeCanvas);

    return () => {
      window.removeEventListener("resize", resizeCanvas);
    };
  }, [elements]);

  return (
    <div className="flex flex-col min-h-screen w-full">
      <div className="flex p-4 bg-gray-800 text-white space-x-4 items-center">
        <button
          onClick={() => setTool("pencil")}
          className={`p-2 rounded ${
            tool === "pencil" ? "bg-blue-500" : "bg-gray-600"
          } hover:bg-blue-400`}
        >
          Pencil
        </button>
        <button
          onClick={() => setTool("eraser")}
          className={`p-2 rounded ${
            tool === "eraser" ? "bg-red-500" : "bg-gray-600"
          } hover:bg-red-400`}
        >
          Eraser
        </button>
        <button
          onClick={() => setTool("rectangle")}
          className={`p-2 rounded ${
            tool === "rectangle" ? "bg-yellow-500" : "bg-gray-600"
          } hover:bg-yellow-400`}
        >
          Rectangle
        </button>
        <button
          onClick={() => setTool("circle")}
          className={`p-2 rounded ${
            tool === "circle" ? "bg-green-500" : "bg-gray-600"
          } hover:bg-green-400`}
        >
          Circle
        </button>
        <button
          onClick={() => setTool("text")}
          className={`p-2 rounded ${
            tool === "text" ? "bg-purple-500" : "bg-gray-600"
          } hover:bg-purple-400`}
        >
          Text
        </button>
        <input
          type="color"
          value={color}
          onChange={(e) => setColor(e.target.value)}
          className="w-12 h-8 border-none rounded"
        />
        <input
          type="number"
          value={fontSize}
          onChange={(e) => setFontSize(Number(e.target.value))}
          className="p-2 border border-gray-600 rounded w-16 text-black"
          min="10"
        />
        <button
          onClick={() => navigate("/")}
          className="p-2 bg-red-500 text-white rounded hover:bg-red-400"
        >
          Exit
        </button>
      </div>

      <div className="flex-grow relative">
        <canvas
          ref={canvasRef}
          className="absolute top-0 left-0 w-full h-full border border-gray-600 bg-white"
        />
      </div>
    </div>
  );
};

export default Board;
