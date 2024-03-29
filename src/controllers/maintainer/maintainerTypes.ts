export interface IMaintainerObject {
	ownerName?: string;
	ownerEmail?: string;
	ownerPhoneNumber?: string;
	maintainerName?: string;
	maintainerEmail?: string;
	maintainerPhoneNumber?: string;
	build?: Array<IBuildingObject>;
}

export interface IBuildingObject {
	buildingName?: string;
	buildingAddress?: string;
	rooms?: Array<IRoomObject>;
}

export interface IRoomObject {
	roomType?: string;
	floor?: string;
	roomNo?: number;
	tenants?: Array<ITenantObject>;
}

export interface ITenantObject {
	tenantName?: string;
	tenantEmail?: string;
	tenantPhoneNumber?: string;
}
