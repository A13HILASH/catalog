// src/services/bookService.js
import api from "./axiosConfig";

export const getBooks = () => api.get("/books");
export const getBook = (id) => api.get(`/books/${id}`);
export const addBook = (book) => api.post("/books", book);
export const updateBook = (id, book) => api.put(`/books/${id}`, book);
export const deleteBook = (id) => api.delete(`/books/${id}`);
