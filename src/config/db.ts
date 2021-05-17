import mongoose from "mongoose";

export default async () => {
	await mongoose
		.connect(process.env.DATABASE_URI as string, {
			useNewUrlParser: true,
			useUnifiedTopology: true,
			useCreateIndex: true,
			useFindAndModify: false,
		})
		.then(() => {
			console.log("Db Connection successful");
		})
		.catch(err => {
			console.log("Failed to connect to db: ", err);
		});
};
