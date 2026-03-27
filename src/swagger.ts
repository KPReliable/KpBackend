import swaggerJsdoc from "swagger-jsdoc";
import swaggerUi from "swagger-ui-express";
import { Application } from "express";

const swaggerDefinition = {
  openapi: "3.0.0",
  info: {
    title: "KpReliable API",
    version: "1.0.0",
    description: "Auto-generated Swagger docs for KpReliable backend",
  },
  servers: [{ url: "http://localhost:3000", description: "Local server" }],
};

const options = {
  swaggerDefinition,
  apis: ["./src/**/*.ts", "./index.ts"],
};

const swaggerSpec = swaggerJsdoc(options);

export function swaggerSetup(app: Application): void {
  app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerSpec));
}
