import React from 'react';
import { Button, Card, CardMedia, CardContent, Typography } from '@mui/material';

export default function SearchResults({ results, onAdd }) {
  return results.map(book => (
    <Card key={book.openLibraryId} style={{ display: 'flex', marginBottom: 10 }}>
      {book.coverUrl && <CardMedia component="img" image={book.coverUrl} style={{ width: 100 }} />}
      <CardContent style={{ flex: 1 }}>
        <Typography variant="h6">{book.title}</Typography>
        <Typography variant="subtitle2">{book.author}</Typography>
        <Typography variant="body2">Year: {book.publishedYear}</Typography>
        <Button variant="contained" onClick={() => onAdd(book)}>Add</Button>
      </CardContent>
    </Card>
  ));
}
