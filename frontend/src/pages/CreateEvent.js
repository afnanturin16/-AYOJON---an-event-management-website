import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Container,
  Box,
  Typography,
  TextField,
  Button,
  Grid,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Alert,
  Paper,
  IconButton,
} from '@mui/material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { useFormik } from 'formik';
import * as yup from 'yup';
import axios from 'axios';
import { AddCircle, RemoveCircle } from '@mui/icons-material';

const validationSchema = yup.object({
  title: yup
    .string()
    .required('Title is required'),
  description: yup
    .string()
    .required('Description is required'),
  eventType: yup
    .string()
    .oneOf(['wedding', 'mehendi', 'birthday', 'corporate', 'other'])
    .required('Event type is required'),
  date: yup
    .date()
    .required('Date is required')
    .min(new Date(), 'Date must be in the future'),
  location: yup
    .string()
    .required('Location is required'),
  budget: yup
    .number()
    .min(0, 'Budget must be positive'),
  guestCount: yup
    .number()
    .min(1, 'Guest count must be at least 1'),
});

const CreateEvent = () => {
  const [images, setImages] = useState([]);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const [vendorRequirements, setVendorRequirements] = useState([
    { category: '', description: '', budget: '' }
  ]);

  const formik = useFormik({
    initialValues: {
      title: '',
      description: '',
      eventType: '',
      date: null,
      location: '',
      budget: '',
      guestCount: '',
    },
    validationSchema: validationSchema,
    onSubmit: async (values) => {
      try {
        setLoading(true);
        setError(null);

        const formData = new FormData();
        
        // Append all form values
        Object.keys(values).forEach(key => {
          if (values[key] !== null && values[key] !== '') {
            if (key === 'date') {
              formData.append(key, values[key].toISOString());
            } else {
              formData.append(key, values[key]);
            }
          }
        });

        // Append images
        images.forEach(image => {
          formData.append('images', image);
        });

        // Append vendor requirements
        formData.append('vendorRequirements', JSON.stringify(vendorRequirements.filter(vr => vr.category && vr.description && vr.budget)));

        // Get the token from localStorage
        const token = localStorage.getItem('token');
        if (!token) {
          throw new Error('Authentication token not found');
        }

        // Make the API request
        const response = await axios.post('/events', formData, {
          headers: {
            'Content-Type': 'multipart/form-data',
            'Authorization': `Bearer ${token}`
          }
        });

        if (response.data) {
          navigate('/dashboard');
          window.location.reload();
        }
      } catch (err) {
        console.error('Error creating event:', err);
        setError(err.response?.data?.message || 'Error creating event. Please try again.');
      } finally {
        setLoading(false);
      }
    },
  });

  const handleImageChange = (event) => {
    const files = Array.from(event.target.files);
    setImages(files);
  };

  const handleVendorRequirementChange = (index, field, value) => {
    const updated = [...vendorRequirements];
    updated[index][field] = value;
    setVendorRequirements(updated);
  };

  const handleAddVendorRequirement = () => {
    setVendorRequirements([...vendorRequirements, { category: '', description: '', budget: '' }]);
  };

  const handleRemoveVendorRequirement = (index) => {
    if (vendorRequirements.length === 1) return;
    setVendorRequirements(vendorRequirements.filter((_, i) => i !== index));
  };

  return (
    <Container maxWidth="md">
      <Box sx={{ mt: 4, mb: 4 }}>
        <Paper elevation={3} sx={{ p: 4 }}>
          <Typography variant="h4" component="h1" gutterBottom align="center">
            Create New Event
          </Typography>
          
          {error && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {error}
            </Alert>
          )}

          <form onSubmit={formik.handleSubmit}>
            <Grid container spacing={3}>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  id="title"
                  name="title"
                  label="Event Title"
                  value={formik.values.title}
                  onChange={formik.handleChange}
                  error={formik.touched.title && Boolean(formik.errors.title)}
                  helperText={formik.touched.title && formik.errors.title}
                />
              </Grid>

              <Grid item xs={12}>
                <TextField
                  fullWidth
                  id="description"
                  name="description"
                  label="Event Description"
                  multiline
                  rows={4}
                  value={formik.values.description}
                  onChange={formik.handleChange}
                  error={formik.touched.description && Boolean(formik.errors.description)}
                  helperText={formik.touched.description && formik.errors.description}
                />
              </Grid>

              <Grid item xs={12}>
                <FormControl fullWidth>
                  <InputLabel id="eventType-label">Event Type</InputLabel>
                  <Select
                    labelId="eventType-label"
                    id="eventType"
                    name="eventType"
                    value={formik.values.eventType}
                    onChange={formik.handleChange}
                    label="Event Type"
                    error={formik.touched.eventType && Boolean(formik.errors.eventType)}
                  >
                    <MenuItem value="wedding">Wedding</MenuItem>
                    <MenuItem value="mehendi">Mehendi</MenuItem>
                    <MenuItem value="birthday">Birthday</MenuItem>
                    <MenuItem value="corporate">Corporate</MenuItem>
                    <MenuItem value="other">Other</MenuItem>
                  </Select>
                </FormControl>
              </Grid>

              <Grid item xs={12} sm={6}>
                <DatePicker
                  label="Event Date"
                  value={formik.values.date}
                  onChange={(date) => formik.setFieldValue('date', date)}
                  renderInput={(params) => (
                    <TextField
                      {...params}
                      fullWidth
                      error={formik.touched.date && Boolean(formik.errors.date)}
                      helperText={formik.touched.date && formik.errors.date}
                    />
                  )}
                />
              </Grid>

              <Grid item xs={12}>
                <TextField
                  fullWidth
                  id="location"
                  name="location"
                  label="Event Location"
                  value={formik.values.location}
                  onChange={formik.handleChange}
                  error={formik.touched.location && Boolean(formik.errors.location)}
                  helperText={formik.touched.location && formik.errors.location}
                />
              </Grid>

              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  id="budget"
                  name="budget"
                  label="Budget"
                  type="number"
                  value={formik.values.budget}
                  onChange={formik.handleChange}
                  error={formik.touched.budget && Boolean(formik.errors.budget)}
                  helperText={formik.touched.budget && formik.errors.budget}
                />
              </Grid>

              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  id="guestCount"
                  name="guestCount"
                  label="Expected Guest Count"
                  type="number"
                  value={formik.values.guestCount}
                  onChange={formik.handleChange}
                  error={formik.touched.guestCount && Boolean(formik.errors.guestCount)}
                  helperText={formik.touched.guestCount && formik.errors.guestCount}
                />
              </Grid>

              <Grid item xs={12}>
                <Typography variant="h6" sx={{ mb: 1 }}>
                  Vendor Requirements
                </Typography>
                {vendorRequirements.map((req, idx) => (
                  <Box key={idx} sx={{ mb: 2, border: '1px solid #eee', borderRadius: 2, p: 2 }}>
                    <Grid container spacing={2} alignItems="center">
                      <Grid item xs={12} sm={3}>
                        <FormControl fullWidth>
                          <InputLabel>Category</InputLabel>
                          <Select
                            value={req.category}
                            label="Category"
                            onChange={e => handleVendorRequirementChange(idx, 'category', e.target.value)}
                          >
                            <MenuItem value="catering">Catering</MenuItem>
                            <MenuItem value="photography">Photography</MenuItem>
                            <MenuItem value="decoration">Decoration</MenuItem>
                            <MenuItem value="music">Music</MenuItem>
                            <MenuItem value="makeup">Makeup</MenuItem>
                            <MenuItem value="other">Other</MenuItem>
                          </Select>
                        </FormControl>
                      </Grid>
                      <Grid item xs={12} sm={6}>
                        <TextField
                          label="Description"
                          fullWidth
                          value={req.description}
                          onChange={e => handleVendorRequirementChange(idx, 'description', e.target.value)}
                        />
                      </Grid>
                      <Grid item xs={10} sm={2}>
                        <TextField
                          label="Budget"
                          type="number"
                          fullWidth
                          value={req.budget}
                          onChange={e => handleVendorRequirementChange(idx, 'budget', e.target.value)}
                        />
                      </Grid>
                      <Grid item xs={2} sm={1}>
                        <IconButton onClick={() => handleRemoveVendorRequirement(idx)} disabled={vendorRequirements.length === 1}>
                          <RemoveCircle color={vendorRequirements.length === 1 ? 'disabled' : 'error'} />
                        </IconButton>
                      </Grid>
                    </Grid>
                  </Box>
                ))}
                <Button startIcon={<AddCircle />} onClick={handleAddVendorRequirement} sx={{ mb: 2 }}>
                  Add Requirement
                </Button>
              </Grid>

              <Grid item xs={12}>
                <Button
                  variant="contained"
                  component="label"
                  fullWidth
                >
                  Upload Images
                  <input
                    type="file"
                    hidden
                    multiple
                    accept="image/*"
                    onChange={handleImageChange}
                  />
                </Button>
                {images.length > 0 && (
                  <Typography variant="body2" sx={{ mt: 1 }}>
                    {images.length} image(s) selected
                  </Typography>
                )}
              </Grid>

              <Grid item xs={12}>
                <Button
                  type="submit"
                  variant="contained"
                  color="primary"
                  fullWidth
                  size="large"
                  disabled={loading}
                >
                  {loading ? 'Creating Event...' : 'Create Event'}
                </Button>
              </Grid>
            </Grid>
          </form>
        </Paper>
      </Box>
    </Container>
  );
};

export default CreateEvent; 