import { ApolloServer } from '@apollo/server';
import { resolvers } from './resolvers/index.js';
import { typeDefs } from './typeDefs.js';

// Create Apollo Server instance
export const createGraphQLServer = async () => {
    const server = new ApolloServer({
        typeDefs,
        resolvers,
        formatError: (formattedError, error) => {
            // Customize error formatting
            return {
                message: formattedError.message,
                code: formattedError.extensions?.code || 'INTERNAL_SERVER_ERROR',
                ...(process.env.NODE_ENV === 'development' && {
                    stack: formattedError.extensions?.stacktrace,
                }),
            };
        },
    });

    await server.start();
    return server;
};

// GraphQL context function
export const graphqlContext = async ({ req }) => {
    // Extract authorization header
    const authHeader = req.headers.authorization || '';

    return {
        authHeader,
    };
};