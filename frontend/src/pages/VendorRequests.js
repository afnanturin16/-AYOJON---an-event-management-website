import React, { useState, useEffect, useCallback } from 'react';
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
  Tabs,
  Tab,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Snackbar,
  Alert as MuiAlert,
} from '@mui/material';
import axios from 'axios';

const VendorRequests = () => {
  const [tabValue, setTabValue] = useState(0);
  const [openRequirements, setOpenRequirements] = useState([]);
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [applyDialog, setApplyDialog] = useState({ open: false, req: null });
  const [proposal, setProposal] = useState('');
  const [price, setPrice] = useState('');
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });
  const [editDialog, setEditDialog] = useState({ open: false, request: null });
  const [withdrawDialog, setWithdrawDialog] = useState({ open: false, request: null });

  // Helper to fetch requests and open requirements
  const fetchAllData = useCallback(async () => {
    try {
      setLoading(true);
      const [openRes, myReqRes] = await Promise.all([
        axios.get('/vendors/open-requirements'),
        axios.get('/vendors/requests'),
      ]);
      setOpenRequirements(Array.isArray(openRes.data) ? openRes.data : []);
      setRequests(Array.isArray(myReqRes.data) ? myReqRes.data : []);
    } catch (err) {
      setOpenRequirements([]);
      setRequests([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAllData();
  }, [fetchAllData]);

  // Refresh data when tab is focused (for real-time update after approval)
  useEffect(() => {
    const handleFocus = () => {
      fetchAllData();
    };
    window.addEventListener('focus', handleFocus);
    return () => window.removeEventListener('focus', handleFocus);
  }, [fetchAllData]);

  const handleTabChange = (event, newValue) => {
    setTabValue(newValue);
  };

  const handleApply = (req) => {
    setApplyDialog({ open: true, req });
    setProposal('');
    setPrice('');
  };

  const handleSubmitProposal = async () => {
    try {
      if (!proposal || !price) {
        setSnackbar({ 
          open: true, 
          message: 'Please fill in all fields', 
          severity: 'error' 
        });
        return;
      }

      await axios.post('/vendors/requests', {
        eventId: applyDialog.req.eventId,
        requirementId: applyDialog.req.requirementId,
        category: applyDialog.req.category,
        proposal,
        price: parseFloat(price),
      });

      setSnackbar({ 
        open: true, 
        message: 'Proposal submitted successfully!', 
        severity: 'success' 
      });
      setApplyDialog({ open: false, req: null });
      
      // Refresh data
      await fetchAllData();
    } catch (err) {
      console.error('Error submitting proposal:', err);
      setSnackbar({ 
        open: true, 
        message: err.response?.data?.message || 'Error submitting proposal', 
        severity: 'error' 
      });
    }
  };

  const handleEdit = (request) => {
    setEditDialog({ open: true, request });
    setProposal(request.proposal);
    setPrice(request.price);
  };

  const handleEditSubmit = async () => {
    try {
      await axios.put(`/vendors/requests/${editDialog.request._id}`, {
        proposal,
        price,
      });
      setSnackbar({ open: true, message: 'Proposal updated!', severity: 'success' });
      setEditDialog({ open: false, request: null });
      // Refresh data
      await fetchAllData();
    } catch (err) {
      console.error('Error updating proposal:', err);
      setSnackbar({ open: true, message: err.response?.data?.message || 'Error updating proposal', severity: 'error' });
    }
  };

  const handleWithdraw = (request) => {
    setWithdrawDialog({ open: true, request });
  };

  const handleWithdrawConfirm = async () => {
    try {
      await axios.delete(`/vendors/requests/${withdrawDialog.request._id}`);
      setSnackbar({ open: true, message: 'Proposal withdrawn!', severity: 'success' });
      setWithdrawDialog({ open: false, request: null });
      // Refresh data
      await fetchAllData();
    } catch (err) {
      console.error('Error withdrawing proposal:', err);
      setSnackbar({ open: true, message: err.response?.data?.message || 'Error withdrawing proposal', severity: 'error' });
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'pending':
        return 'warning';
      case 'approved':
        return 'success';
      case 'rejected':
        return 'error';
      default:
        return 'default';
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

  return (
    <Container maxWidth="lg" sx={{ mt: 8 }}>
      <Box sx={{ display: 'flex', justifyContent: 'flex-end', mb: 2 }}>
        <Button variant="outlined" onClick={fetchAllData}>Refresh</Button>
      </Box>
      <Box sx={{ mt: 4, mb: 4 }}>
        <Typography variant="h4" component="h1" gutterBottom>
          Vendor Dashboard
        </Typography>
        <Tabs value={tabValue} onChange={handleTabChange} sx={{ mb: 3 }}>
          <Tab label="Open Opportunities" />
          <Tab label="My Proposals" />
        </Tabs>
        {tabValue === 0 && (
          <>
            {loading ? (
              <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
                <Typography>Loading open opportunities...</Typography>
              </Box>
            ) : openRequirements.length === 0 ? (
              <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
                <Typography>No open opportunities available at the moment.</Typography>
              </Box>
            ) : (
              <Grid container spacing={3}>
                {openRequirements.map((req) => (
                  <Grid item key={req.requirementId} xs={12} md={6}>
                    <Card sx={{ height: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                      <CardContent>
                        <Typography variant="h6">{req.eventTitle}</Typography>
                        <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                          {new Date(req.eventDate).toLocaleDateString()} | {req.eventLocation}
                        </Typography>
                        <Typography variant="body2" sx={{ mb: 1 }}>
                          <b>Category:</b> {req.category}
                        </Typography>
                        <Typography variant="body2" sx={{ mb: 1 }}>
                          <b>Description:</b> {req.description}
                        </Typography>
                        <Typography variant="body2" sx={{ mb: 1 }}>
                          <b>Budget:</b> ${req.budget}
                        </Typography>
                        <Typography variant="body2" sx={{ mb: 1 }}>
                          <b>Organizer:</b> {req.organizer?.name || 'Unknown'}
                        </Typography>
                      </CardContent>
                      <Box sx={{ p: 2, pt: 0, display: 'flex', justifyContent: 'flex-end' }}>
                        <Button variant="contained" onClick={() => handleApply(req)}>
                          Apply / Submit Proposal
                        </Button>
                      </Box>
                    </Card>
                  </Grid>
                ))}
              </Grid>
            )}
          </>
        )}
        {tabValue === 1 && (
          <Grid container spacing={3}>
            {requests.map((request) => (
              <Grid item key={request._id} xs={12} md={6}>
                <Card>
                  <CardContent>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                      <Typography variant="h6">
                        {request.event.title}
                      </Typography>
                      <Chip
                        label={request.status}
                        color={getStatusColor(request.status)}
                      />
                    </Box>
                    <Typography variant="subtitle1" sx={{ mb: 1 }}>
                      Category: {request.category}
                    </Typography>
                    <Typography variant="body2" sx={{ mb: 2 }}>
                      {request.proposal}
                    </Typography>
                    <Divider sx={{ my: 2 }} />
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <Typography variant="body2">
                        Price: ${request.price}
                      </Typography>
                      <Box>
                        <Button
                          size="small"
                          onClick={() => window.location.href = `/events/${request.event._id}`}
                        >
                          View Event
                        </Button>
                        {request.status === 'pending' && (
                          <>
                            <Button size="small" color="primary" onClick={() => handleEdit(request)}>
                              Edit
                            </Button>
                            <Button size="small" color="error" onClick={() => handleWithdraw(request)}>
                              Withdraw
                            </Button>
                          </>
                        )}
                      </Box>
                    </Box>
                  </CardContent>
                </Card>
              </Grid>
            ))}
          </Grid>
        )}
      </Box>
      {/* Proposal Dialog */}
      <Dialog open={applyDialog.open} onClose={() => setApplyDialog({ open: false, req: null })}>
        <DialogTitle>Submit Proposal</DialogTitle>
        <DialogContent>
          <Typography variant="subtitle1" sx={{ mb: 1 }}>
            {applyDialog.req && applyDialog.req.eventTitle} - {applyDialog.req && applyDialog.req.category}
          </Typography>
          <TextField
            autoFocus
            margin="dense"
            label="Proposal"
            fullWidth
            multiline
            rows={3}
            value={proposal}
            onChange={(e) => setProposal(e.target.value)}
          />
          <TextField
            margin="dense"
            label="Price"
            type="number"
            fullWidth
            value={price}
            onChange={(e) => setPrice(e.target.value)}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setApplyDialog({ open: false, req: null })}>Cancel</Button>
          <Button onClick={handleSubmitProposal} variant="contained">Submit</Button>
        </DialogActions>
      </Dialog>
      {/* Edit Proposal Dialog */}
      <Dialog open={editDialog.open} onClose={() => setEditDialog({ open: false, request: null })}>
        <DialogTitle>Edit Proposal</DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            margin="dense"
            label="Proposal"
            fullWidth
            multiline
            rows={3}
            value={proposal}
            onChange={(e) => setProposal(e.target.value)}
          />
          <TextField
            margin="dense"
            label="Price"
            type="number"
            fullWidth
            value={price}
            onChange={(e) => setPrice(e.target.value)}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setEditDialog({ open: false, request: null })}>Cancel</Button>
          <Button onClick={handleEditSubmit} variant="contained">Save</Button>
        </DialogActions>
      </Dialog>
      {/* Withdraw Proposal Dialog */}
      <Dialog open={withdrawDialog.open} onClose={() => setWithdrawDialog({ open: false, request: null })}>
        <DialogTitle>Withdraw Proposal</DialogTitle>
        <DialogContent>
          <Typography>Are you sure you want to withdraw this proposal?</Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setWithdrawDialog({ open: false, request: null })}>Cancel</Button>
          <Button onClick={handleWithdrawConfirm} color="error" variant="contained">Withdraw</Button>
        </DialogActions>
      </Dialog>
      {/* Snackbar for feedback */}
      <Snackbar open={snackbar.open} autoHideDuration={3000} onClose={() => setSnackbar({ ...snackbar, open: false })}>
        <MuiAlert elevation={6} variant="filled" severity={snackbar.severity} onClose={() => setSnackbar({ ...snackbar, open: false })}>
          {snackbar.message}
        </MuiAlert>
      </Snackbar>
    </Container>
  );
};

export default VendorRequests; 