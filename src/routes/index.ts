import { Application } from "express";
import user from "./user/User.route"

const appRoutes = (app:Application)=>{
  app.use("/api/v1",user)
}

export default appRoutes