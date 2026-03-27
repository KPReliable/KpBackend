import app from "./src/app";

const port = Number(process.env.PORT) || 5000;

const server = app.listen(port, () => {
  // eslint-disable-next-line no-console
  console.log(`Server is running at http://localhost:${port}`);
});

server.on("error", (error: NodeJS.ErrnoException) => {
  if (error.code === "EADDRINUSE") {
    // eslint-disable-next-line no-console
    console.error(`Port ${port} is already in use. Use another port or stop conflicting service.`);
    process.exit(1);
  }
  throw error;
});
