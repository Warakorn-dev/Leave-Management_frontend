declare const _default: () => {
    port: number;
    database: {
        url: string | undefined;
    };
    jwt: {
        secret: string;
        refreshSecret: string;
        expiration: string;
        refreshExpiration: string;
    };
    email: {
        host: string;
        port: number;
        user: string | undefined;
        pass: string | undefined;
    };
};
export default _default;
