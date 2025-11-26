import { authResolvers } from './authResolvers.js';
import { bookResolvers } from './bookResolvers.js';
import { borrowingResolvers } from './borrowingResolvers.js';
import { reportResolvers } from './reportResolvers.js';

// Merge all resolvers
export const resolvers = {
    Query: {
        ...authResolvers.Query,
        ...bookResolvers.Query,
        ...borrowingResolvers.Query,
        ...reportResolvers.Query,
    },
    Mutation: {
        ...authResolvers.Mutation,
        ...bookResolvers.Mutation,
        ...borrowingResolvers.Mutation,
    },
};