import { Service } from "../service-lifecycle/definitions";

export type ServiceHistory = Service & { serviceId: Service["id"] };
