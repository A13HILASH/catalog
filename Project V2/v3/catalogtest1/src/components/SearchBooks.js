import React, { useState, useEffect, useCallback, useRef } from 'react';
import axios from 'axios';
import Chatbot from '../components/GeneralChatbot';
import {
  Button, TextField, Grid, Card, CardMedia, CardContent, Typography,
  Dialog, DialogTitle, DialogContent, DialogActions, CardActions,
  CircularProgress, Pagination, InputLabel, Select, MenuItem, FormControl,
  Chip, Box, Divider, Paper, InputAdornment, IconButton, Fab, Zoom, useTheme,
  alpha, styled, Skeleton, Container, AppBar, Toolbar, Tabs, Tab,
  Badge, Avatar, Backdrop
} from '@mui/material';
import {
  Search as SearchIcon,
  Add as AddIcon,
  Info as InfoIcon,
  Clear as ClearIcon,
  Refresh as RefreshIcon,
  AutoAwesome as AutoAwesomeIcon,
  Star as StarIcon,
  StarBorder as StarBorderIcon,
  Book as BookIcon,
  FilterList as FilterIcon,
  Close as CloseIcon,
  Favorite as FavoriteIcon,
  FavoriteBorder as FavoriteBorderIcon,
  LibraryBooks as LibraryBooksIcon,
  LocalLibrary as LocalLibraryIcon
} from '@mui/icons-material';
import { addBook, getBooks } from '../services/bookService';
import { useSnackbar } from 'notistack';
import FloatingChatbot from './FloatingChatbot';


// Styled components with modern design
const SearchCard = styled(Paper)(({ theme }) => ({
  padding: theme.spacing(4),
  marginBottom: theme.spacing(4),
  borderRadius: theme.spacing(3),
  boxShadow: '0 8px 32px rgba(0,0,0,0.1)',
  background: alpha(theme.palette.background.paper, 0.95),
  backdropFilter: 'blur(12px)',
  border: `1px solid ${alpha(theme.palette.divider, 0.1)}`,
  transition: 'all 0.3s ease',
  '&:hover': {
    boxShadow: '0 12px 40px rgba(0,0,0,0.15)',
  },
}));

const BookCard = styled(Card)(({ theme }) => ({
  height: '100%',
  display: 'flex',
  flexDirection: 'column',
  borderRadius: theme.spacing(2),
  overflow: 'hidden',
  transition: 'all 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275)',
  position: 'relative',
  boxShadow: '0 4px 20px rgba(0,0,0,0.08)',
  '&:hover': {
    transform: 'translateY(-8px) scale(1.02)',
    boxShadow: '0 12px 30px rgba(0,0,0,0.18)',
  },
  '&::before': {
    content: '""',
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: '4px',
    background: `linear-gradient(90deg, ${theme.palette.primary.main}, ${theme.palette.secondary.main})`,
    transform: 'scaleX(0)',
    transformOrigin: 'left',
    transition: 'transform 0.3s ease',
  },
  '&:hover::before': {
    transform: 'scaleX(1)',
  },
}));

const RecommendationCard = styled(Card)(({ theme }) => ({
  display: 'flex',
  p: theme.spacing(2),
  mb: theme.spacing(2),
  borderRadius: theme.spacing(2),
  transition: 'all 0.3s ease',
  background: alpha(theme.palette.background.paper, 0.9),
  backdropFilter: 'blur(8px)',
  border: `1px solid ${alpha(theme.palette.divider, 0.1)}`,
  '&:hover': {
    transform: 'translateX(8px)',
    boxShadow: '0 8px 24px rgba(0,0,0,0.12)',
    background: alpha(theme.palette.background.paper, 1),
  },
}));

const GenreChip = styled(Chip)(({ theme }) => ({
  fontWeight: 600,
  fontSize: '0.75rem',
  height: 28,
  borderRadius: 16,
  backgroundColor: alpha(theme.palette.primary.main, 0.15),
  color: theme.palette.primary.main,
  border: `1px solid ${alpha(theme.palette.primary.main, 0.2)}`,
  '& .MuiChip-label': {
    paddingLeft: theme.spacing(1.5),
    paddingRight: theme.spacing(1.5),
  },
  '&:hover': {
    backgroundColor: alpha(theme.palette.primary.main, 0.25),
  },
}));

const AddButton = styled(Button)(({ theme }) => ({
  borderRadius: 24,
  fontWeight: 600,
  textTransform: 'none',
  padding: theme.spacing(1, 2.5),
  boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
  transition: 'all 0.3s ease',
  '&:hover': {
    boxShadow: '0 6px 16px rgba(0,0,0,0.2)',
    transform: 'translateY(-2px)',
  },
}));

const SearchButton = styled(Button)(({ theme }) => ({
  borderRadius: 28,
  fontWeight: 600,
  textTransform: 'none',
  padding: theme.spacing(1.5, 4),
  boxShadow: '0 4px 16px rgba(0,0,0,0.18)',
  background: `linear-gradient(45deg, ${theme.palette.primary.main}, ${theme.palette.primary.dark})`,
  transition: 'all 0.3s ease',
  '&:hover': {
    boxShadow: '0 6px 20px rgba(0,0,0,0.25)',
    transform: 'translateY(-2px)',
    background: `linear-gradient(45deg, ${theme.palette.primary.dark}, ${theme.palette.primary.main})`,
  },
}));

// Compact button styles for recommendation form
const CompactButton = styled(Button)(({ theme }) => ({
  borderRadius: 20,
  fontWeight: 600,
  textTransform: 'none',
  padding: theme.spacing(0.75, 2),
  fontSize: '0.875rem',
  transition: 'all 0.3s ease',
  '&:hover': {
    transform: 'translateY(-1px)',
  },
}));

const RecommendationFab = styled(Fab)(({ theme }) => ({
  position: 'fixed',
  bottom: theme.spacing(12),
  right: theme.spacing(4),
  zIndex: 1000,
  width: 64,
  height: 64,
  background: `linear-gradient(135deg, ${theme.palette.secondary.main}, ${theme.palette.primary.main})`,
  color: theme.palette.common.white,
  boxShadow: '0 8px 24px rgba(0,0,0,0.25)',
  transition: 'all 0.3s ease',
  '&:hover': {
    transform: 'scale(1.1) rotate(10deg)',
    boxShadow: '0 12px 30px rgba(0,0,0,0.35)',
    background: `linear-gradient(135deg, ${theme.palette.secondary.dark}, ${theme.palette.primary.dark})`,
  },
}));

const EmptyState = styled(Box)(({ theme }) => ({
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  justifyContent: 'center',
  padding: theme.spacing(8),
  textAlign: 'center',
  borderRadius: theme.spacing(3),
  background: alpha(theme.palette.background.paper, 0.6),
  backdropFilter: 'blur(8px)',
  border: `1px dashed ${alpha(theme.palette.divider, 0.3)}`,
}));

const HeaderAppBar = styled(AppBar)(({ theme }) => ({
  background: `linear-gradient(90deg, ${alpha(theme.palette.primary.main, 0.95)}, ${alpha(theme.palette.secondary.main, 0.95)})`,
  backdropFilter: 'blur(10px)',
  boxShadow: '0 4px 20px rgba(0,0,0,0.1)',
  borderRadius: theme.spacing(0, 0, 3, 3),
}));

const TabPanel = (props) => {
  const { children, value, index, ...other } = props;
  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`simple-tabpanel-${index}`}
      aria-labelledby={`simple-tab-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ p: 0 }}>{children}</Box>}
    </div>
  );
};

// Fixed height container for recommendations to prevent layout shifts
const RecommendationContainer = styled(Paper)(({ theme }) => ({
  padding: theme.spacing(3),
  borderRadius: theme.spacing(3),
  height: 'calc(100vh - 200px)',
  display: 'flex',
  flexDirection: 'column',
  boxShadow: '0 8px 32px rgba(0,0,0,0.1)',
  background: alpha(theme.palette.background.paper, 0.95),
  backdropFilter: 'blur(12px)',
  border: `1px solid ${alpha(theme.palette.divider, 0.1)}`,
}));

// Fixed height form section - made more compact
const RecommendationForm = styled(Box)(({ theme }) => ({
  flexShrink: 0,
  marginBottom: theme.spacing(2),
  paddingBottom: theme.spacing(2),
  borderBottom: `1px solid ${alpha(theme.palette.divider, 0.1)}`,
}));

// Scrollable results section - takes more space
const RecommendationResults = styled(Box)(({ theme }) => ({
  flexGrow: 1,
  overflowY: 'auto',
  paddingRight: theme.spacing(1),
  '&::-webkit-scrollbar': {
    width: 8,
  },
  '&::-webkit-scrollbar-track': {
    background: alpha(theme.palette.divider, 0.1),
    borderRadius: 4,
  },
  '&::-webkit-scrollbar-thumb': {
    background: alpha(theme.palette.primary.main, 0.3),
    borderRadius: 4,
    '&:hover': {
      background: alpha(theme.palette.primary.main, 0.5),
    },
  },
}));

export default function SearchBooks() {
  const { enqueueSnackbar } = useSnackbar();
  const theme = useTheme();
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [myBooks, setMyBooks] = useState([]);
  const [selectedBook, setSelectedBook] = useState(null);
  const [loading, setLoading] = useState(false);
  const [totalResults, setTotalResults] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(12);
  const [genreFilter, setGenreFilter] = useState('');
  const [authorFilter, setAuthorFilter] = useState('');
  const [debouncedQuery, setDebouncedQuery] = useState('');
  const timeoutRef = useRef(null);
  
  // AI Recommendation states
  const [recommendationQuery, setRecommendationQuery] = useState('');
  const [selectedGenre, setSelectedGenre] = useState('');
  const [selectedMood, setSelectedMood] = useState('');
  const [recommendations, setRecommendations] = useState([]);
  const [loadingRecommendations, setLoadingRecommendations] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  
  // Tab state
  const [tabValue, setTabValue] = useState(0);
  
  // Fallback image for missing book covers
  const fallbackImage = 'https://via.placeholder.com/180x250?text=No+Cover';
  
  // Genre options
  const genreOptions = [
    'Fiction', 'Non-Fiction', 'Science Fiction', 'Fantasy', 'Mystery', 
    'Thriller', 'Romance', 'Historical Fiction', 'Biography', 'Autobiography',
    'Self-Help', 'Horror', 'Young Adult', 'Children\'s', 'Poetry', 'Drama', 
    'Adventure', 'Crime', 'Science', 'History', 'Philosophy'
  ];
  
  // Mood options
  const moodOptions = [
    'Happy', 'Sad', 'Exciting', 'Relaxing', 'Thoughtful', 'Funny', 
    'Scary', 'Romantic', 'Inspiring', 'Dark', 'Uplifting', 'Melancholic',
    'Adventurous', 'Mysterious', 'Nostalgic', 'Hopeful'
  ];

  const loadMyBooks = useCallback(async () => {
    try {
      const response = await getBooks();
      setMyBooks(response.data);
    } catch (error) {
      console.error("Error loading My Books:", error);
      enqueueSnackbar("Failed to load your books.", { variant: 'error' });
    }
  }, [enqueueSnackbar]);
  
  useEffect(() => {
    loadMyBooks();
  }, [loadMyBooks]);

  // Debounce search input
  useEffect(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    
    timeoutRef.current = setTimeout(() => {
      setDebouncedQuery(query);
    }, 500);
    
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [query]);

  const search = async (page = 1) => {
    if (!debouncedQuery && !genreFilter && !authorFilter) return;
    
    setLoading(true);
    try {
      let searchQuery = debouncedQuery;
      
      // Add filters to the search query
      if (authorFilter) {
        searchQuery += `+inauthor:${authorFilter}`;
      }
      if (genreFilter) {
        searchQuery += `+subject:${genreFilter}`;
      }
      
      const startIndex = (page - 1) * itemsPerPage;
      const res = await axios.get(
        `https://www.googleapis.com/books/v1/volumes?q=${encodeURIComponent(searchQuery)}&startIndex=${startIndex}&maxResults=${itemsPerPage}`
      );
      
      setResults(res.data.items || []);
      setTotalResults(res.data.totalItems || 0);
      setCurrentPage(page);
    } catch (error) {
      console.error("Error searching Google Books:", error);
      enqueueSnackbar("Failed to search Google Books.", { variant: 'error' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (debouncedQuery || genreFilter || authorFilter) {
      search(1);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [debouncedQuery, genreFilter, authorFilter]);

  const handlePageChange = (event, page) => {
    search(page);
  };

  const handleAdd = async (v) => {
    const exists = myBooks.find(b => b.openLibraryId === v.id);
    if (exists) {
      enqueueSnackbar('Already in My Books', { variant: 'warning' });
      return;
    }
    const vol = v.volumeInfo;
    try {
      await addBook({
        openLibraryId: v.id,
        title: vol.title,
        authors: (vol.authors || []).join(', '),
        genres: (vol.categories || []).map(category => 
          category.replace(/\s*&\s*/g, ', ')
        ).join(', '),
        year: parseInt(vol.publishedDate || '0'),
        coverUrl: vol.imageLinks?.thumbnail
      });
      enqueueSnackbar('Book added successfully!', { variant: 'success' });
      setResults(prev => prev.filter(x => x.id !== v.id));
      loadMyBooks();
    } catch (error) {
      console.error("Error adding book:", error);
      enqueueSnackbar('Failed to add book.', { variant: 'error' });
    }
  };

  const openDetails = (book) => {
    setSelectedBook(book);
  };

  const closeDetails = () => {
    setSelectedBook(null);
  };

  const handleImageError = (e) => {
    e.target.onerror = null;
    e.target.src = fallbackImage;
  };

  // AI Recommendation function
  const handleGetRecommendations = async () => {
    if (!recommendationQuery.trim() && !selectedGenre && !selectedMood) {
      enqueueSnackbar('Please provide at least one preference', { variant: 'warning' });
      return;
    }
    setLoadingRecommendations(true);
    try {
      const prompt = `I'm looking for book recommendations with the following preferences:
        ${selectedGenre ? `Genre: ${selectedGenre}` : ''}
        ${selectedMood ? `Mood: ${selectedMood}` : ''}
        ${recommendationQuery ? `Additional details: ${recommendationQuery}` : ''}
        
        Please recommend 5 books that match these preferences. For each book, provide:
        1. Title
        2. Author
        3. Brief description (1-2 sentences)
        4. Main genre
        
        Format your response as a JSON array with objects containing: title, author, description, genre.
      `;
      const response = await axios.post(
        'https://api.cohere.ai/v1/generate',
        {
          model: 'command',
          prompt: prompt,
          max_tokens: 800,
          temperature: 0.7,
          k: 0,
          stop_sequences: [],
          return_likelihoods: 'NONE'
        },
        {
          headers: {
            'Authorization': `Bearer ${process.env.REACT_APP_COHERE_API_KEY}`,
            'Content-Type': 'application/json'
          }
        }
      );
      // Extract the JSON from the response
      const generatedText = response.data.generations[0].text;
      const jsonMatch = generatedText.match(/\[[\s\S]*\]/);
      
      if (jsonMatch) {
        const recommendationsData = JSON.parse(jsonMatch[0]);
        setRecommendations(recommendationsData);
      } else {
        // Fallback if JSON parsing fails
        const fallbackRecommendations = [
          {
            title: "The Great Gatsby",
            author: "F. Scott Fitzgerald",
            description: "A classic novel about the American Dream set in the Jazz Age.",
            genre: "Fiction"
          },
          {
            title: "To Kill a Mockingbird",
            author: "Harper Lee",
            description: "A powerful story of racial injustice and childhood innocence.",
            genre: "Fiction"
          }
        ];
        setRecommendations(fallbackRecommendations);
        enqueueSnackbar('Using fallback recommendations', { variant: 'info' });
      }
    } catch (error) {
      console.error("Error getting recommendations:", error);
      enqueueSnackbar('Failed to get recommendations. Please try again.', { variant: 'error' });
      
      // Fallback recommendations
      const fallbackRecommendations = [
        {
          title: "The Great Gatsby",
          author: "F. Scott Fitzgerald",
          description: "A classic novel about the American Dream set in the Jazz Age.",
          genre: "Fiction"
        },
        {
          title: "To Kill a Mockingbird",
          author: "Harper Lee",
          description: "A powerful story of racial injustice and childhood innocence.",
          genre: "Fiction"
        }
      ];
      setRecommendations(fallbackRecommendations);
    } finally {
      setLoadingRecommendations(false);
    }
  };

  const handleSearchRecommendedBook = (title, author) => {
    setQuery(`${title} ${author}`);
    setGenreFilter('');
    setAuthorFilter('');
    setTabValue(0); // Switch to search tab
    // This will trigger the debounced search automatically
  };

  const clearFilters = () => {
    setQuery('');
    setGenreFilter('');
    setAuthorFilter('');
    setResults([]);
    setTotalResults(0);
  };

  const clearRecommendations = () => {
    setRecommendationQuery('');
    setSelectedGenre('');
    setSelectedMood('');
    setRecommendations([]);
  };

  const handleTabChange = (event, newValue) => {
    setTabValue(newValue);
  };

  return (
    <>
      <HeaderAppBar position="static" elevation={0}>
        <Toolbar>
          <LocalLibraryIcon sx={{ mr: 2, fontSize: 32 }} />
          <Typography variant="h5" component="div" sx={{ flexGrow: 1, fontWeight: 700 }}>
            BOOK CATALOGUE
          </Typography>
          <Badge badgeContent={myBooks.length} color="secondary">
            <Avatar sx={{ bgcolor: alpha(theme.palette.common.white, 0.2) }}>
              <LibraryBooksIcon />
            </Avatar>
          </Badge>
        </Toolbar>
      </HeaderAppBar>

      <Container maxWidth="xl" sx={{ mt: 4, mb: 8 }}>
        {/* Tabs for navigation */}
        <Paper sx={{ mb: 4, borderRadius: 3, overflow: 'hidden' }}>
          <Tabs
            value={tabValue}
            onChange={handleTabChange}
            variant="fullWidth"
            indicatorColor="secondary"
            textColor="secondary"
            aria-label="discovery tabs"
          >
            <Tab 
              icon={<SearchIcon />} 
              label="Search Books" 
              iconPosition="start"
              sx={{ fontWeight: 600, py: 2 }}
            />
            <Tab 
              icon={<AutoAwesomeIcon />} 
              label="AI Recommendations" 
              iconPosition="start"
              sx={{ fontWeight: 600, py: 2 }}
            />
          </Tabs>
        </Paper>

        {/* Search Tab */}
        <TabPanel value={tabValue} index={0}>
          {/* Search Section */}
          <SearchCard>
            <Typography variant="h4" fontWeight={700} gutterBottom color="primary">
              Discover Your Next Favorite Book
            </Typography>
            <Typography variant="body1" color="text.secondary" mb={3}>
              Search by title, author, or keywords to find the perfect book
            </Typography>
            
            <Grid container spacing={3} alignItems="flex-end">
              <Grid item xs={12} md={8}>
                <TextField
                  fullWidth
                  variant="outlined"
                  placeholder="Search books, authors, or keywords..."
                  value={query}
                  onChange={e => setQuery(e.target.value)}
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <SearchIcon color="primary" />
                      </InputAdornment>
                    ),
                    endAdornment: query && (
                      <InputAdornment position="end">
                        <IconButton onClick={() => setQuery('')} size="small">
                          <ClearIcon />
                        </IconButton>
                      </InputAdornment>
                    ),
                    sx: {
                      borderRadius: 3,
                      '& fieldset': { borderWidth: 2 },
                      '&:hover fieldset': { borderColor: theme.palette.primary.main },
                      '&.Mui-focused fieldset': { borderColor: theme.palette.primary.main },
                    }
                  }}
                />
              </Grid>
              
              <Grid item xs={12} md={4}>
                <SearchButton 
                  variant="contained" 
                  fullWidth 
                  onClick={() => search(1)}
                  disabled={loading}
                  startIcon={loading ? <CircularProgress size={20} color="inherit" /> : <SearchIcon />}
                >
                  {loading ? 'Searching...' : 'Search Books'}
                </SearchButton>
              </Grid>
              
              <Grid item xs={12}>
                <Button 
                  variant="text" 
                  onClick={() => setShowFilters(!showFilters)}
                  startIcon={<FilterIcon />}
                  size="small"
                  sx={{ fontWeight: 600 }}
                >
                  {showFilters ? 'Hide Filters' : 'Show Advanced Filters'}
                </Button>
              </Grid>
              
              {showFilters && (
                <>
                  <Grid item xs={12} md={6}>
                    <FormControl fullWidth variant="outlined" size="medium">
                      <InputLabel>Genre</InputLabel>
                      <Select
                        value={genreFilter}
                        label="Genre"
                        onChange={e => setGenreFilter(e.target.value)}
                        sx={{ borderRadius: 2 }}
                      >
                        <MenuItem value="">All Genres</MenuItem>
                        {genreOptions.map((genre) => (
                          <MenuItem key={genre} value={genre}>{genre}</MenuItem>
                        ))}
                      </Select>
                    </FormControl>
                  </Grid>
                  
                  <Grid item xs={12} md={6}>
                    <TextField
                      fullWidth
                      variant="outlined"
                      placeholder="Filter by author"
                      value={authorFilter}
                      onChange={e => setAuthorFilter(e.target.value)}
                      InputProps={{
                        startAdornment: (
                          <InputAdornment position="start">
                            <BookIcon color="primary" />
                          </InputAdornment>
                        ),
                        endAdornment: authorFilter && (
                          <InputAdornment position="end">
                            <IconButton onClick={() => setAuthorFilter('')} size="small">
                              <ClearIcon />
                            </IconButton>
                          </InputAdornment>
                        ),
                        sx: {
                          borderRadius: 2,
                          '& fieldset': { borderWidth: 2 },
                        }
                      }}
                    />
                  </Grid>
                </>
              )}
              
              {(query || genreFilter || authorFilter) && (
                <Grid item xs={12}>
                  <Button 
                    variant="outlined" 
                    onClick={clearFilters}
                    startIcon={<RefreshIcon />}
                    size="small"
                    sx={{ fontWeight: 600, borderRadius: 2 }}
                  >
                    Clear all filters
                  </Button>
                </Grid>
              )}
            </Grid>
          </SearchCard>
          
          {/* Results Section */}
          {loading ? (
            <Grid container spacing={3} sx={{ mt: 2 }}>
              {[...Array(8)].map((_, index) => (
                <Grid item xs={12} sm={6} md={4} lg={3} key={index}>
                  <Card sx={{ height: '100%', display: 'flex', flexDirection: 'column', borderRadius: 3 }}>
                    <Skeleton variant="rectangular" height={220} sx={{ borderRadius: 3 }} />
                    <CardContent>
                      <Skeleton variant="text" height={28} width="80%" />
                      <Skeleton variant="text" height={22} width="60%" />
                      <Skeleton variant="text" height={20} width="40%" sx={{ mt: 1 }} />
                    </CardContent>
                    <CardActions>
                      <Skeleton variant="rectangular" height={36} width={100} sx={{ borderRadius: 2 }} />
                      <Skeleton variant="rectangular" height={36} width={80} sx={{ borderRadius: 2 }} />
                    </CardActions>
                  </Card>
                </Grid>
              ))}
            </Grid>
          ) : results.length === 0 ? (
            <EmptyState>
              <LocalLibraryIcon sx={{ fontSize: 80, color: 'text.disabled', mb: 3 }} />
              <Typography variant="h5" fontWeight={600} color="text.secondary" gutterBottom>
                No books found
              </Typography>
              <Typography variant="body1" color="text.secondary" mb={4}>
                Try a different search term or filter, or get AI recommendations
              </Typography>
              <Button 
                variant="contained" 
                size="large"
                onClick={() => setTabValue(1)}
                startIcon={<AutoAwesomeIcon />}
                sx={{ borderRadius: 3, px: 4, py: 1.5 }}
              >
                Get AI Recommendations
              </Button>
            </EmptyState>
          ) : (
            <>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
                <Typography variant="h5" fontWeight={600}>
                  {totalResults} books found
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Page {currentPage} of {Math.ceil(totalResults / itemsPerPage)}
                </Typography>
              </Box>
              
              <Grid container spacing={3}>
                {results.map((v) => {
                  const vol = v.volumeInfo;
                  const isInMyBooks = myBooks.some(b => b.openLibraryId === v.id);
                  
                  return (
                    <Grid item xs={12} sm={6} md={4} lg={3} key={v.id}>
                      <BookCard>
                        <CardMedia
                          component="img"
                          height="220"
                          image={vol.imageLinks?.thumbnail || fallbackImage}
                          alt={vol.title}
                          sx={{ objectFit: 'cover' }}
                          onError={handleImageError}
                        />
                        <CardContent sx={{ flexGrow: 1, pt: 2 }}>
                          <Typography variant="h6" fontWeight={600} noWrap sx={{ mb: 1 }}>
                            {vol.title}
                          </Typography>
                          {vol.authors && (
                            <Typography variant="body2" color="text.secondary" noWrap sx={{ mb: 1.5 }}>
                              {vol.authors.join(', ')}
                            </Typography>
                          )}
                          {vol.categories && (
                            <Box sx={{ mb: 1.5 }}>
                              <GenreChip label={vol.categories[0]} size="small" />
                            </Box>
                          )}
                          {vol.averageRating && (
                            <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                              {[...Array(5)].map((_, i) => (
                                i < Math.floor(vol.averageRating) ? 
                                  <StarIcon key={i} fontSize="small" color="warning" /> : 
                                  <StarBorderIcon key={i} fontSize="small" color="disabled" />
                              ))}
                              <Typography variant="body2" color="text.secondary" sx={{ ml: 0.5 }}>
                                {vol.averageRating.toFixed(1)}
                              </Typography>
                            </Box>
                          )}
                        </CardContent>
                        <CardActions sx={{ pt: 0, pb: 2 }}>
                          <Button 
                            size="small" 
                            onClick={() => openDetails(v)}
                            startIcon={<InfoIcon />}
                            sx={{ fontWeight: 600, borderRadius: 2 }}
                          >
                            Details
                          </Button>
                          <AddButton 
                            size="small" 
                            variant="contained"
                            onClick={() => handleAdd(v)}
                            disabled={isInMyBooks}
                            startIcon={isInMyBooks ? <FavoriteIcon /> : <FavoriteBorderIcon />}
                            color={isInMyBooks ? "success" : "primary"}
                          >
                            {isInMyBooks ? 'Added' : 'Add'}
                          </AddButton>
                        </CardActions>
                      </BookCard>
                    </Grid>
                  );
                })}
              </Grid>
              
              {totalResults > itemsPerPage && (
                <Grid container justifyContent="center" sx={{ mt: 5, mb: 2 }}>
                  <Pagination
                    count={Math.ceil(totalResults / itemsPerPage)}
                    page={currentPage}
                    onChange={handlePageChange}
                    color="primary"
                    showFirstButton
                    showLastButton
                    size="large"
                    siblingCount={2}
                    boundaryCount={1}
                    sx={{
                      '& .MuiPaginationItem-root': {
                        borderRadius: 2,
                        fontWeight: 600,
                      },
                      '& .Mui-selected': {
                        background: `linear-gradient(45deg, ${theme.palette.primary.main}, ${theme.palette.secondary.main})`,
                        color: 'white',
                      }
                    }}
                  />
                </Grid>
              )}
            </>
          )}
        </TabPanel>

        {/* AI Recommendations Tab */}
        <TabPanel value={tabValue} index={1}>
          <RecommendationContainer>
            <RecommendationForm>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <AutoAwesomeIcon color="secondary" sx={{ mr: 2, fontSize: 28 }} />
                <Typography variant="h5" fontWeight={600}>AI-Powered Recommendations</Typography>
              </Box>
              <Typography variant="body1" paragraph>
                Describe your reading preferences and let our AI recommend books tailored just for you!
              </Typography>
              
              <Grid container spacing={2}>
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    label="Describe what you're looking for"
                    placeholder="e.g., A story about space exploration with strong female characters"
                    multiline
                    rows={2}
                    value={recommendationQuery}
                    onChange={(e) => setRecommendationQuery(e.target.value)}
                    variant="outlined"
                    InputProps={{
                      startAdornment: (
                        <InputAdornment position="start">
                          <InfoIcon color="primary" />
                        </InputAdornment>
                      ),
                      sx: {
                        borderRadius: 2,
                        '& fieldset': { borderWidth: 2 },
                      }
                    }}
                  />
                </Grid>
                
                <Grid item xs={12} md={6}>
                  <FormControl fullWidth variant="outlined" size="medium">
                    <InputLabel>Genre</InputLabel>
                    <Select
                      value={selectedGenre}
                      label="Genre"
                      onChange={(e) => setSelectedGenre(e.target.value)}
                      sx={{ borderRadius: 2 }}
                    >
                      <MenuItem value="">Any Genre</MenuItem>
                      {genreOptions.map((genre) => (
                        <MenuItem key={genre} value={genre}>{genre}</MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Grid>
                
                <Grid item xs={12} md={6}>
                  <FormControl fullWidth variant="outlined" size="medium">
                    <InputLabel>Mood</InputLabel>
                    <Select
                      value={selectedMood}
                      label="Mood"
                      onChange={(e) => setSelectedMood(e.target.value)}
                      sx={{ borderRadius: 2 }}
                    >
                      <MenuItem value="">Any Mood</MenuItem>
                      {moodOptions.map((mood) => (
                        <MenuItem key={mood} value={mood}>{mood}</MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Grid>
                
                <Grid item xs={12} sx={{ display: 'flex', gap: 2, justifyContent: 'flex-start' }}>
                  <CompactButton 
                    variant="contained" 
                    onClick={handleGetRecommendations}
                    disabled={loadingRecommendations}
                    startIcon={loadingRecommendations ? <CircularProgress size={16} color="inherit" /> : <AutoAwesomeIcon />}
                    sx={{ minWidth: 180 }}
                  >
                    {loadingRecommendations ? 'Generating...' : 'Get Recommendations'}
                  </CompactButton>
                  
                  <CompactButton 
                    variant="outlined" 
                    onClick={clearRecommendations}
                    startIcon={<ClearIcon />}
                    sx={{ minWidth: 100 }}
                  >
                    Clear
                  </CompactButton>
                </Grid>
              </Grid>
            </RecommendationForm>
            
            <RecommendationResults>
              {recommendations.length > 0 ? (
                <>
                  <Box sx={{ mb: 2 }}>
                    <Typography variant="h5" fontWeight={600} gutterBottom>Recommended Books</Typography>
                  </Box>
                  
                  {recommendations.map((book, index) => (
                    <RecommendationCard key={index}>
                      <Box sx={{ display: 'flex', flexDirection: 'column', flex: 1 }}>
                        <CardContent sx={{ flex: '1 0 auto', pb: 1 }}>
                          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 1 }}>
                            <Box>
                              <Typography variant="h6" fontWeight={600}>{book.title}</Typography>
                              <Typography variant="subtitle1" color="text.secondary">
                                by {book.author}
                              </Typography>
                            </Box>
                            <GenreChip label={book.genre} size="small" />
                          </Box>
                          <Typography variant="body1" sx={{ lineHeight: 1.5 }}>
                            {book.description}
                          </Typography>
                        </CardContent>
                        <CardActions sx={{ pt: 0 }}>
                          <Button 
                            variant="contained"
                            onClick={() => handleSearchRecommendedBook(book.title, book.author)}
                            startIcon={<SearchIcon />}
                            sx={{ fontWeight: 600, borderRadius: 2 }}
                          >
                            Search this book
                          </Button>
                        </CardActions>
                      </Box>
                    </RecommendationCard>
                  ))}
                </>
              ) : (
                <EmptyState sx={{ height: '100%', minHeight: 200 }}>
                  <AutoAwesomeIcon sx={{ fontSize: 64, color: 'text.disabled', mb: 2 }} />
                  <Typography variant="h6" fontWeight={600} color="text.secondary" gutterBottom>
                    No recommendations yet
                  </Typography>
                  <Typography variant="body1" color="text.secondary">
                    Fill out the form above to get personalized book recommendations
                  </Typography>
                </EmptyState>
              )}
            </RecommendationResults>
          </RecommendationContainer>
        </TabPanel>
      </Container>

      {/* AI Recommendations FAB - Only visible on Search tab */}
      {tabValue === 0 && (
        <Zoom in={true}>
          <RecommendationFab 
            color="primary" 
            aria-label="recommendations"
            onClick={() => setTabValue(1)}
          >
            <AutoAwesomeIcon />
          </RecommendationFab>
        </Zoom>
      )}

      {/*<Chatbot />*/}
      <FloatingChatbot books={myBooks} loadBooks={loadMyBooks} />
      
      {/* Detail Modal */}
      <Backdrop open={!!selectedBook} sx={{ zIndex: 1200, color: '#fff' }} />
      <Dialog 
        open={!!selectedBook} 
        onClose={closeDetails} 
        maxWidth="md" 
        fullWidth
        PaperProps={{
          sx: { 
            borderRadius: 4, 
            overflow: 'hidden',
            boxShadow: '0 20px 60px rgba(0,0,0,0.3)',
            position: 'relative',
            zIndex: 1201
          }
        }}
      >
        <DialogTitle 
          sx={{ 
            background: `linear-gradient(135deg, ${theme.palette.primary.main}, ${theme.palette.secondary.main})`,
            color: 'white',
            py: 4,
            px: 4,
            position: 'relative',
          }}
        >
          <IconButton
            aria-label="close"
            onClick={closeDetails}
            sx={{
              position: 'absolute',
              right: 16,
              top: 16,
              color: 'white',
              bgcolor: alpha(theme.palette.common.white, 0.2),
              '&:hover': {
                bgcolor: alpha(theme.palette.common.white, 0.3),
              }
            }}
          >
            <CloseIcon />
          </IconButton>
          <Typography variant="h4" fontWeight={700}>
            {selectedBook?.volumeInfo?.title}
          </Typography>
        </DialogTitle>
        <DialogContent dividers sx={{ p: 4 }}>
          <Grid container spacing={4}>
            <Grid item xs={12} md={4}>
              <img
                src={selectedBook?.volumeInfo?.imageLinks?.thumbnail || fallbackImage}
                alt={selectedBook?.volumeInfo?.title}
                style={{ 
                  width: '100%', 
                  borderRadius: 12,
                  boxShadow: '0 8px 24px rgba(0,0,0,0.15)'
                }}
                onError={handleImageError}
              />
              {selectedBook?.volumeInfo?.averageRating && (
                <Box sx={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  mt: 3, 
                  p: 2, 
                  borderRadius: 2,
                  background: alpha(theme.palette.background.paper, 0.8),
                  backdropFilter: 'blur(8px)'
                }}>
                  <Typography variant="h6" fontWeight={600} sx={{ mr: 2 }}>
                    Rating:
                  </Typography>
                  <Box sx={{ display: 'flex', alignItems: 'center' }}>
                    {[...Array(5)].map((_, i) => (
                      i < Math.floor(selectedBook.volumeInfo.averageRating) ? 
                        <StarIcon key={i} fontSize="small" color="warning" /> : 
                        <StarBorderIcon key={i} fontSize="small" color="disabled" />
                    ))}
                    <Typography variant="body1" fontWeight={600} sx={{ ml: 1 }}>
                      {selectedBook.volumeInfo.averageRating.toFixed(1)}
                    </Typography>
                  </Box>
                </Box>
              )}
            </Grid>
            <Grid item xs={12} md={8}>
              <Typography variant="h5" fontWeight={600} gutterBottom>Book Details</Typography>
              
              <Grid container spacing={2}>
                <Grid item xs={6}>
                  <Typography variant="subtitle2" color="text.secondary">Author</Typography>
                  <Typography variant="body1" fontWeight={500}>
                    {(selectedBook?.volumeInfo?.authors || []).join(', ') || 'N/A'}
                  </Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="subtitle2" color="text.secondary">Genre</Typography>
                  <Typography variant="body1" fontWeight={500}>
                    {selectedBook?.volumeInfo?.categories?.[0] || 'N/A'}
                  </Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="subtitle2" color="text.secondary">Published</Typography>
                  <Typography variant="body1" fontWeight={500}>
                    {selectedBook?.volumeInfo?.publishedDate || 'N/A'}
                  </Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="subtitle2" color="text.secondary">Publisher</Typography>
                  <Typography variant="body1" fontWeight={500}>
                    {selectedBook?.volumeInfo?.publisher || 'N/A'}
                  </Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="subtitle2" color="text.secondary">Page Count</Typography>
                  <Typography variant="body1" fontWeight={500}>
                    {selectedBook?.volumeInfo?.pageCount || 'N/A'}
                  </Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="subtitle2" color="text.secondary">Language</Typography>
                  <Typography variant="body1" fontWeight={500}>
                    {selectedBook?.volumeInfo?.language || 'N/A'}
                  </Typography>
                </Grid>
              </Grid>
              
              <Divider sx={{ my: 3 }} />
              
              <Typography variant="h5" fontWeight={600} gutterBottom>Description</Typography>
              <Typography variant="body1" color="text.secondary" paragraph sx={{ lineHeight: 1.7 }}>
                {selectedBook?.volumeInfo?.description || 'No description available.'}
              </Typography>
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions sx={{ px: 4, py: 3, background: alpha(theme.palette.background.paper, 0.8) }}>
          <Button onClick={closeDetails} variant="outlined" sx={{ borderRadius: 2, fontWeight: 600 }}>
            Close
          </Button>
          <AddButton 
            variant="contained"
            onClick={() => handleAdd(selectedBook)}
            startIcon={<AddIcon />}
            disabled={myBooks.some(b => b.openLibraryId === selectedBook?.id)}
          >
            {myBooks.some(b => b.openLibraryId === selectedBook?.id) ? 'Already Added' : 'Add to My Books'}
          </AddButton>
        </DialogActions>
      </Dialog>
    </>
  );
}