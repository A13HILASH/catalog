import axios from 'axios';

const BASE_URL = 'https://localhost:7110/api/books'; // adjust if port differs

export const getBooks = () => axios.get(BASE_URL);
export const addBook = (book) => axios.post(BASE_URL, book);
export const updateBook = (id, book) => axios.put(`${BASE_URL}/${id}`, book);
export const deleteBook = (id) => axios.delete(`${BASE_URL}/${id}`);