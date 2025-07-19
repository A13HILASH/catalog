import axios from 'axios';
const API = "http://localhost:4540/api/books";
export const getBooks = () => axios.get(API);
export const addBook = book => axios.post(API, book);
export const updateBook = (id, book) => axios.put(`${API}/${id}`, book);
export const deleteBook = id => axios.delete(`${API}/${id}`);
