import gql from 'graphql-tag';

export const typeDefs = gql`
  # User Types
  type User {
    id: ID!
    name: String!
    email: String!
    role: String!
    isActive: Boolean!
    createdAt: String!
    updatedAt: String!
  }

  type AuthPayload {
    success: Boolean!
    message: String!
    user: User
    token: String
  }

  # Book Types
  type Book {
    id: ID!
    title: String!
    author: String!
    isbn: String!
    publicationDate: String!
    genre: String!
    totalCopies: Int!
    availableCopies: Int!
    isActive: Boolean!
    createdAt: String!
    updatedAt: String!
  }

  type BooksResponse {
    success: Boolean!
    count: Int!
    total: Int!
    totalPages: Int!
    currentPage: Int!
    data: [Book!]!
  }

  type BookResponse {
    success: Boolean!
    message: String
    data: Book
  }

  # Borrowing Types
  type Borrowing {
    id: ID!
    userId: User!
    bookId: Book!
    borrowDate: String!
    dueDate: String!
    returnDate: String
    status: String!
    createdAt: String!
    updatedAt: String!
  }

  type BorrowingResponse {
    success: Boolean!
    message: String!
    data: Borrowing
  }

  type BorrowingsListResponse {
    success: Boolean!
    count: Int!
    total: Int!
    totalPages: Int!
    currentPage: Int!
    data: [Borrowing!]!
  }

  # Report Types
  type MostBorrowedBook {
    id: ID!
    borrowCount: Int!
    currentlyBorrowed: Int!
    title: String!
    author: String!
    isbn: String!
    genre: String!
    totalCopies: Int!
    availableCopies: Int!
  }

  type ActiveMember {
    id: ID!
    totalBorrowings: Int!
    currentBorrowings: Int!
    returnedBooks: Int!
    name: String!
    email: String!
    role: String!
  }

  type GenreAvailability {
    genre: String!
    totalBooks: Int!
    totalCopies: Int!
    availableCopies: Int!
    borrowedCopies: Int!
  }

  type AvailabilitySummary {
    totalBooks: Int!
    totalCopies: Int!
    availableCopies: Int!
    borrowedCopies: Int!
    availabilityPercentage: Float!
  }

  type BookAvailabilityReport {
    success: Boolean!
    summary: AvailabilitySummary!
    currentBorrowings: Int!
    genreWiseAvailability: [GenreAvailability!]!
  }

  type MostBorrowedBooksReport {
    success: Boolean!
    count: Int!
    data: [MostBorrowedBook!]!
  }

  type ActiveMembersReport {
    success: Boolean!
    count: Int!
    data: [ActiveMember!]!
  }

  type OverdueBooksReport {
    success: Boolean!
    count: Int!
    data: [Borrowing!]!
  }

  # Generic Response
  type Response {
    success: Boolean!
    message: String!
  }

  # Input Types
  input RegisterInput {
    name: String!
    email: String!
    password: String!
    role: String
  }

  input LoginInput {
    email: String!
    password: String!
  }

  input AddBookInput {
    title: String!
    author: String!
    isbn: String!
    publicationDate: String!
    genre: String!
    totalCopies: Int!
    availableCopies: Int!
  }

  input UpdateBookInput {
    title: String
    author: String
    isbn: String
    publicationDate: String
    genre: String
    totalCopies: Int
    availableCopies: Int
  }

  # Queries
  type Query {
    # Auth
    me: User!

    # Books
    getBooks(
      page: Int
      limit: Int
      genre: String
      author: String
      title: String
    ): BooksResponse!
    
    getBookById(id: ID!): BookResponse!

    # Borrowings
    getBorrowHistory(
      page: Int
      limit: Int
      status: String
    ): BorrowingsListResponse!
    
    getAllBorrowings(
      page: Int
      limit: Int
      status: String
      userId: ID
    ): BorrowingsListResponse!

    # Reports
    mostBorrowedBooks(limit: Int): MostBorrowedBooksReport!
    activeMembers(limit: Int): ActiveMembersReport!
    bookAvailability: BookAvailabilityReport!
    overdueBooks: OverdueBooksReport!
  }

  # Mutations
  type Mutation {
    # Auth
    register(input: RegisterInput!): AuthPayload!
    login(input: LoginInput!): AuthPayload!

    # Books
    addBook(input: AddBookInput!): BookResponse!
    updateBook(id: ID!, input: UpdateBookInput!): BookResponse!
    deleteBook(id: ID!): Response!

    # Borrowings
    borrowBook(bookId: ID!): BorrowingResponse!
    returnBook(borrowingId: ID!): BorrowingResponse!
  }
`;