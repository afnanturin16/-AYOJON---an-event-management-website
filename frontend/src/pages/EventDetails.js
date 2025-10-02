import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Container,
  Box,
  Typography,
  Grid,
  Card,
  CardContent,
  Button,
  Chip,
  Divider,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Alert,
  Paper,
  Avatar,
  Tabs,
  Tab,
} from '@mui/material';
import { format } from 'date-fns';
import axios from 'axios';
import { useAuth } from '../contexts/AuthContext';
import Chat from '../components/Chat';

const EventDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [event, setEvent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [openDialog, setOpenDialog] = useState(false);
  const [selectedRequirement, setSelectedRequirement] = useState(null);
  const [proposal, setProposal] = useState('');
  const [price, setPrice] = useState('');
  const [proposals, setProposals] = useState([]);
  const [proposalsLoading, setProposalsLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [selectedTab, setSelectedTab] = useState(0);
  const [selectedVendor, setSelectedVendor] = useState(null);

  useEffect(() => {
    const fetchEventDetails = async () => {
      try {
        setLoading(true);
        setError(null);
        const res = await axios.get(`/events/${id}`);
        console.log('Event details response:', res.data);
        setEvent(res.data);
      } catch (err) {
        console.error('Error fetching event details:', err);
        setError(err.response?.data?.message || 'Error fetching event details');
      } finally {
        setLoading(false);
      }
    };

    fetchEventDetails();
  }, [id]);

  useEffect(() => {
    const fetchProposals = async () => {
      if (!user || !event || event.organizer._id !== (user._id || user.id)) return;
      setProposalsLoading(true);
      try {
        const res = await axios.get(`/events/${id}/proposals`);
        setProposals(res.data);
      } catch (err) {
        setProposals([]);
      } finally {
        setProposalsLoading(false);
      }
    };
    fetchProposals();
  }, [user, event, id]);

  const handleTabChange = (event, newValue) => {
    setSelectedTab(newValue);
  };

  const handleVendorSelect = (vendor) => {
    setSelectedVendor(vendor);
    setSelectedTab(1);
  };

  const handleVendorRequest = async () => {
    try {
      await axios.post('/vendor-requests', {
        event: id,
        requirement: selectedRequirement._id,
        proposal,
        price: parseFloat(price),
      });
      setOpenDialog(false);
      // Refresh event details
      const res = await axios.get(`/events/${id}`);
      setEvent(res.data);
    } catch (err) {
      setError(err.response?.data?.message || 'Error submitting vendor request');
    }
  };

  const handleProposalAction = async (proposalId, status) => {
    setActionLoading(true);
    try {
      await axios.put(`/vendors/requests/${proposalId}`, { status });
      // Refresh proposals
      const res = await axios.get(`/events/${id}/proposals`);
      setProposals(res.data);
    } catch (err) {
      // Optionally show error
    } finally {
      setActionLoading(false);
    }
  };

  if (loading) {
    return (
      <Container>
        <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
          <Typography>Loading...</Typography>
        </Box>
      </Container>
    );
  }

  if (error || !event) {
    return (
      <Container>
        <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
          <Alert severity="error">{error || 'Event not found'}</Alert>
        </Box>
      </Container>
    );
  }

  return (
    <Container maxWidth="md" sx={{ mt: 12, mb: 4 }}>
      <Paper elevation={4} sx={{ p: 0, overflow: 'hidden', borderRadius: 4 }}>
        {/* Header Section */}
        <Box sx={{
          background: 'linear-gradient(90deg, #a1c4fd 0%, #c2e9fb 100%)',
          p: 4,
          display: 'flex',
          alignItems: 'center',
          gap: 3,
        }}>
          <Avatar
            src={event.organizer?.avatar || 'https://randomuser.me/api/portraits/men/32.jpg'}
            alt={event.organizer?.name || 'Organizer'}
            sx={{ width: 64, height: 64, boxShadow: 2 }}
          />
          <Box>
            <Typography variant="h4" sx={{ fontWeight: 700, color: 'primary.main', mb: 1 }}>{event.title}</Typography>
            <Typography variant="subtitle1" color="text.secondary" sx={{ mb: 0.5 }}>
              {new Date(event.date).toLocaleDateString()} at {event.location}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Organized by <b>{event.organizer?.name}</b> ({event.organizer?.email})
            </Typography>
          </Box>
        </Box>
        {/* Event Description */}
        <Box sx={{ p: 4, pt: 2 }}>
          <Typography variant="body1" paragraph sx={{ fontSize: 18, color: 'text.primary' }}>{event.description}</Typography>
          <Box sx={{ mb: 3 }}>
            <Typography variant="h6" gutterBottom sx={{ fontWeight: 600, color: 'primary.main' }}>Vendor Requirements</Typography>
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
              {event.vendorRequirements.map((req, index) => (
                <Chip
                  key={index}
                  label={`${req.type || req.category}: ${req.status}`}
                  color={req.status === 'open' ? 'primary' : 'default'}
                  sx={{ fontWeight: 600, fontSize: 15, px: 2, py: 1, borderRadius: 2, boxShadow: 1 }}
                />
              ))}
            </Box>
          </Box>
          <Divider sx={{ my: 3 }} />
          <Grid container spacing={3}>
            <Grid item xs={12} sm={4}>
              <Paper elevation={2} sx={{ p: 2, borderRadius: 3, textAlign: 'center', background: 'linear-gradient(135deg, #fbc2eb 0%, #a6c1ee 100%)', color: '#333' }}>
                <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>Budget</Typography>
                <Typography variant="h5" sx={{ fontWeight: 700 }}>${event.budget}</Typography>
              </Paper>
            </Grid>
            <Grid item xs={12} sm={4}>
              <Paper elevation={2} sx={{ p: 2, borderRadius: 3, textAlign: 'center', background: 'linear-gradient(135deg, #a1c4fd 0%, #c2e9fb 100%)', color: '#333' }}>
                <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>Guests</Typography>
                <Typography variant="h5" sx={{ fontWeight: 700 }}>{event.guestCount}</Typography>
              </Paper>
            </Grid>
            <Grid item xs={12} sm={4}>
              <Paper elevation={2} sx={{ p: 2, borderRadius: 3, textAlign: 'center', background: 'linear-gradient(135deg, #fbc2eb 0%, #a1c4fd 100%)', color: '#333' }}>
                <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>Status</Typography>
                <Typography variant="h5" sx={{ fontWeight: 700, textTransform: 'capitalize' }}>{event.status}</Typography>
              </Paper>
            </Grid>
          </Grid>
        </Box>
      </Paper>
    </Container>
  );
};

export default EventDetails; 