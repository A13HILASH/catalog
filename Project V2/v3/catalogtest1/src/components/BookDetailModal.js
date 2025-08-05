import React from 'react';
import {
  Dialog, DialogTitle, DialogContent, DialogActions,
  Button, Typography, Divider, Link
} from '@mui/material';

export default function BookDetailModal({ open, handleClose, book }) {
  if (!book) return null;

  const info = book.volumeInfo;

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="md" fullWidth>
      <DialogTitle>{info.title}</DialogTitle>
      <DialogContent dividers>
        {info.imageLinks?.thumbnail && (
          <img
            src={info.imageLinks.thumbnail}
            alt={info.title}
            style={{ float: 'right', height: 160, marginLeft: 16 }}
          />
        )}
        <Typography gutterBottom><strong>Author:</strong> {(info.authors || []).join(', ')}</Typography>
        {info.publisher && <Typography gutterBottom><strong>Publisher:</strong> {info.publisher}</Typography>}
        {info.publishedDate && <Typography gutterBottom><strong>Published:</strong> {info.publishedDate}</Typography>}
        {info.pageCount && <Typography gutterBottom><strong>Pages:</strong> {info.pageCount}</Typography>}
        {info.language && <Typography gutterBottom><strong>Language:</strong> {info.language.toUpperCase()}</Typography>}
        {info.categories && <Typography gutterBottom><strong>Genre:</strong> {info.categories.join(', ')}</Typography>}
        {info.description && (
          <>
            <Divider sx={{ my: 2 }} />
            <Typography variant="body2">{info.description}</Typography>
          </>
        )}
      </DialogContent>
      <DialogActions>
        {info.previewLink && (
          <Link href={info.previewLink} target="_blank" rel="noopener">
            <Button>Preview</Button>
          </Link>
        )}
        <Button onClick={handleClose} variant="outlined">Close</Button>
      </DialogActions>
    </Dialog>
  );
}
