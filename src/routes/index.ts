import { Application } from "express";
import user from "./user/User.route"
import contact from "./contact/Contact.route"
import { BaseEndpoints } from "../constants/Routes.constant";


const appRoutes = (app:Application)=>{
  app.use(BaseEndpoints.Base,user)
  app.use(BaseEndpoints.Base,contact)

  
}

export default appRoutes