import express, { Application, Request, Response } from "express";
import { buildSchema } from "graphql";
const { graphqlHTTP } = require('express-graphql');
const app: Application = express();
const port = 8000;

// GraphQL schema
let schema = buildSchema(`
    type Query {
        message: String
    }
`);
// Root resolver
let root = {
    message: () => 'Hello World!' + Math.random()
};

// Body parsing Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// add CORS header for auth requests coming from ui.dhaval.ml domain
app.use((req: Request, res: Response, next: any) => {
    res.header('Access-Control-Allow-Origin', 'https://ui.dhaval.ml');
    res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
    if (req.method === 'OPTIONS') {
        res.header('Access-Control-Allow-Methods', 'PUT, POST, PATCH, DELETE, GET');
        return res.status(200).json({});
    }
    next();
});

// ensure that the user is authenticated with a jwt token issued by 'https://d0b000000venlea2-dev-ed.my.salesforce.com' for requests to path 'healthcheck'
app.use('/graphql', (req: Request, res: Response, next: any) => {
    const authHeader = req.headers.authorization;
    if (authHeader) {
        const token = authHeader.split(' ')[1];
        const jwt = require('jsonwebtoken');
        const decoded = jwt.decode(token, { complete: true });
        if (decoded && decoded.payload.iss === 'https://d0b000000venlea2-dev-ed.my.salesforce.com') {
            next();
        } else {
            res.status(401).json({
                message: 'Unauthorized'
            });
        }
    } else {
        res.status(401).json({
            message: 'Unauthorized'
        });
    }
});

app.use('/graphql', graphqlHTTP({
    schema: schema,
    rootValue: root,
    graphiql: true
}));


try {
    app.listen(port, (): void => {
        console.log(`Express GraphQL Server Now Running On http://localhost:${port}/graphql`);
    });
} catch (error) {
    console.error(`Error occured: ${error}`);
}
