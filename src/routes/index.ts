import { Application } from "express";
import user from "./user/User.route"
import contact from "./contact/Contact.route"
import schedule from "./schedule_booking/schedule.route"
import { BaseEndpoints } from "../constants/Routes.constant";


const appRoutes = (app:Application)=>{
  app.use(BaseEndpoints.Base,user)
  app.use(BaseEndpoints.Base,contact)
  app.use(BaseEndpoints.Base,schedule)

  
}

export default appRoutes