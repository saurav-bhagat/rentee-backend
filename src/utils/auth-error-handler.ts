export interface userError {
    email?: string;
    name?: string;
    password?: string;
    phoneNumber?: string;
}

const handleAuthError = (err: any) => {
    const errors: userError = {};
    if (err.message.includes("user validation failed")) {
        Object.values(err.errors).forEach((err) => {
            // @ts-ignore
            errors[err.properties.path] = err.properties.message;
        });
    }
    return errors;
};

export default handleAuthError;
