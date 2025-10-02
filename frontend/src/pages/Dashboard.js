import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Container,
  Box,
  Typography,
  Grid,
  Card,
  CardContent,
  Button,
  Tabs,
  Tab,
  Chip,
  Divider,
  Avatar,
  useMediaQuery,
  Paper,
  LinearProgress,
} from '@mui/material';
import { format } from 'date-fns';
import axios from 'axios';
import { useAuth } from '../contexts/AuthContext';
import { StaticDatePicker } from '@mui/x-date-pickers/StaticDatePicker';
import { PickersDay } from '@mui/x-date-pickers/PickersDay';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { isSameDay } from 'date-fns';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from 'recharts';

const Dashboard = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [tabValue, setTabValue] = useState(0);
  const [events, setEvents] = useState([]);
  const [vendorRequests, setVendorRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const isDesktop = useMediaQuery('(min-width:900px)');
  const [calendarDate, setCalendarDate] = useState(new Date());
  const eventDates = events.map(e => new Date(e.date));
  const [analytics, setAnalytics] = useState({
    totalEvents: 0,
    upcomingEvents: 0,
    completedEvents: 0,
    totalBudget: 0,
    vendorStats: [],
    eventTypeDistribution: [],
  });

  // Refresh button state
  const [refreshFn, setRefreshFn] = useState(() => () => {});
  const [refreshAnalyticsFn, setRefreshAnalyticsFn] = useState(() => () => {});

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        console.log('Current user:', user);
        if (user.role === 'user') {
          const res = await axios.get('/events/my-events');
          console.log('Fetched events:', res.data);
          setEvents(res.data);
        } else if (user.role === 'vendor') {
          const res = await axios.get('/vendor-requests/my-requests');
          setVendorRequests(res.data);
        }
      } catch (err) {
        console.error('Error fetching dashboard data:', err);
        // Show error message to user
        if (err.response) {
          console.error('Error response:', err.response.data);
        }
      } finally {
        setLoading(false);
      }
    };

    fetchData();
    // Expose fetchData for refresh
    setRefreshFn(() => fetchData);
  }, [user]);

  useEffect(() => {
    const fetchAnalytics = async () => {
      if (user.role === 'user') {
        try {
          const res = await axios.get('/events/analytics');
          setAnalytics(res.data);
        } catch (err) {
          console.error('Error fetching analytics:', err);
        }
      }
    };

    fetchAnalytics();
    setRefreshAnalyticsFn(() => fetchAnalytics);
  }, [user]);

  // Auto-refresh analytics when events change
  useEffect(() => {
    if (user.role === 'user') {
      refreshAnalyticsFn();
    }
  }, [events]);

  useEffect(() => {
    const handleRefreshDashboard = () => {
      refreshFn();
      refreshAnalyticsFn();
    };
    window.addEventListener('refreshDashboard', handleRefreshDashboard);
    return () => window.removeEventListener('refreshDashboard', handleRefreshDashboard);
  }, [refreshFn, refreshAnalyticsFn]);

  const handleTabChange = (event, newValue) => {
    setTabValue(newValue);
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

  return (
    <Box
      sx={{
        minHeight: '100vh',
        background: `
          linear-gradient(120deg, #a1c4fd 0%, #c2e9fb 50%, #fbc2eb 100%),
          url('data:image/svg+xml;utf8,<svg width="100%25" height="100%25" viewBox="0 0 1440 320" fill="none" xmlns="http://www.w3.org/2000/svg"><path fill="%23ffffff" fill-opacity="0.08" d="M0,160L60,170.7C120,181,240,203,360,197.3C480,192,600,160,720,133.3C840,107,960,85,1080,101.3C1200,117,1320,171,1380,197.3L1440,224L1440,320L1380,320C1320,320,1200,320,1080,320C960,320,840,320,720,320C600,320,480,320,360,320C240,320,120,320,60,320L0,320Z"></path></svg>') repeat-x bottom`,
        backgroundSize: 'cover, 100% 300px',
        backgroundPosition: 'top, bottom',
        backgroundAttachment: 'fixed',
        py: 6,
      }}
    >
      <Container maxWidth="lg">
        <Box sx={{ mt: 8, mb: 4, display: isDesktop ? 'flex' : 'block', gap: 4 }}>
          <Box sx={{ flex: 1 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, flexWrap: 'wrap' }}>
                <Avatar
                  src={user?.avatar || 'https://randomuser.me/api/portraits/men/32.jpg'}
                  alt={user?.name || 'User'}
                  sx={{ width: 56, height: 56, boxShadow: '0 2px 8px rgba(0,0,0,0.08)' }}
                />
                <Box>
                  <Typography variant="h4" component="h1" sx={{ fontWeight: 700, color: 'primary.main', letterSpacing: '-1px' }}>
                    Dashboard
                  </Typography>
                  <Box sx={{ width: 80, height: 4, background: 'linear-gradient(90deg, #FF6B6B, #FF8E53)', borderRadius: 2, mt: 1 }} />
                </Box>
                <Button
                  variant="outlined"
                  size="small"
                  onClick={refreshFn}
                  disabled={loading}
                  sx={{ ml: 2, height: 36 }}
                >
                  Refresh
                </Button>
              </Box>
              {user.role === 'user' && (
                <Button
                  variant="contained"
                  color="primary"
                  onClick={() => navigate('/create-event')}
                  sx={{
                    background: 'linear-gradient(45deg, #FF6B6B 30%, #FF8E53 90%)',
                    color: 'white',
                    fontWeight: 600,
                    '&:hover': {
                      background: 'linear-gradient(45deg, #FF8E53 30%, #FF6B6B 90%)',
                    }
                  }}
                >
                  Create New Event
                </Button>
              )}
            </Box>
            <Tabs value={tabValue} onChange={handleTabChange} sx={{ mb: 3 }}>
              {user.role === 'vendor' ? (
                <Tab label="My Vendor Requests" sx={{ fontWeight: 600, color: 'primary.main' }} />
              ) : (
                <Tab label="My Events" sx={{ fontWeight: 600, color: 'primary.main' }} />
              )}
            </Tabs>

            {user.role === 'user' && (
              <Box sx={{ mb: 4 }}>
                <Typography variant="h5" sx={{ mb: 3, fontWeight: 600, color: 'primary.main' }}>
                  Event Analytics
                </Typography>
                <Grid container spacing={3}>
                  <Grid item xs={12} md={3}>
                    <Card sx={{ 
                      background: 'linear-gradient(45deg, #FF6B6B 30%, #FF8E53 90%)',
                      color: 'white',
                      borderRadius: 3,
                      boxShadow: '0 4px 20px 0 rgba(255,107,107,0.2)',
                    }}>
                      <CardContent>
                        <Typography variant="h6" gutterBottom>Total Events</Typography>
                        <Typography variant="h3">{analytics.totalEvents}</Typography>
                      </CardContent>
                    </Card>
                  </Grid>
                  <Grid item xs={12} md={3}>
                    <Card sx={{ 
                      background: 'linear-gradient(45deg, #4ECDC4 30%, #45B7D1 90%)',
                      color: 'white',
                      borderRadius: 3,
                      boxShadow: '0 4px 20px 0 rgba(78,205,196,0.2)',
                    }}>
                      <CardContent>
                        <Typography variant="h6" gutterBottom>Upcoming Events</Typography>
                        <Typography variant="h3">{analytics.upcomingEvents}</Typography>
                      </CardContent>
                    </Card>
                  </Grid>
                  <Grid item xs={12} md={3}>
                    <Card sx={{ 
                      background: 'linear-gradient(45deg, #FFD166 30%, #FF6B6B 90%)',
                      color: 'white',
                      borderRadius: 3,
                      boxShadow: '0 4px 20px 0 rgba(255,209,102,0.2)',
                    }}>
                      <CardContent>
                        <Typography variant="h6" gutterBottom>Total Budget</Typography>
                        <Typography variant="h3">${analytics.totalBudget}</Typography>
                      </CardContent>
                    </Card>
                  </Grid>
                  <Grid item xs={12} md={3}>
                    <Card sx={{ 
                      background: 'linear-gradient(45deg, #A78BFA 30%, #818CF8 90%)',
                      color: 'white',
                      borderRadius: 3,
                      boxShadow: '0 4px 20px 0 rgba(167,139,250,0.2)',
                    }}>
                      <CardContent>
                        <Typography variant="h6" gutterBottom>Completed Events</Typography>
                        <Typography variant="h3">{analytics.completedEvents}</Typography>
                      </CardContent>
                    </Card>
                  </Grid>
                </Grid>

                <Grid container spacing={3} sx={{ mt: 2 }}>
                  <Grid item xs={12} md={6}>
                    <Card sx={{ p: 2, borderRadius: 3 }}>
                      <Typography variant="h6" sx={{ mb: 2 }}>Event Types Distribution</Typography>
                      <ResponsiveContainer width="100%" height={300}>
                        <PieChart>
                          <Pie
                            data={analytics.eventTypeDistribution}
                            dataKey="value"
                            nameKey="name"
                            cx="50%"
                            cy="50%"
                            outerRadius={80}
                            label
                          >
                            {analytics.eventTypeDistribution.map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={['#FF6B6B', '#4ECDC4', '#FFD166', '#A78BFA', '#818CF8'][index % 5]} />
                            ))}
                          </Pie>
                          <Tooltip />
                          <Legend />
                        </PieChart>
                      </ResponsiveContainer>
                    </Card>
                  </Grid>
                  <Grid item xs={12} md={6}>
                    <Card sx={{ p: 2, borderRadius: 3 }}>
                      <Typography variant="h6" sx={{ mb: 2 }}>Vendor Requirements Status</Typography>
                      <ResponsiveContainer width="100%" height={300}>
                        <BarChart data={analytics.vendorStats}>
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis dataKey="category" />
                          <YAxis />
                          <Tooltip />
                          <Legend />
                          <Bar dataKey="open" stackId="a" fill="#FF6B6B" />
                          <Bar dataKey="assigned" stackId="a" fill="#4ECDC4" />
                          <Bar dataKey="completed" stackId="a" fill="#FFD166" />
                        </BarChart>
                      </ResponsiveContainer>
                    </Card>
                  </Grid>
                </Grid>
              </Box>
            )}

            {user.role === 'vendor' ? (
              <Grid container spacing={3}>
                {vendorRequests.map((request) => (
                  <Grid item key={request._id} xs={12} md={6}>
                    <Card
                      sx={{
                        borderRadius: 3,
                        boxShadow: '0 4px 24px 0 rgba(78,205,196,0.10)',
                        transition: 'transform 0.2s, box-shadow 0.2s',
                        '&:hover': {
                          transform: 'translateY(-6px) scale(1.02)',
                          boxShadow: '0 8px 32px 0 rgba(78,205,196,0.18)',
                        },
                      }}
                    >
                      <CardContent>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                          <Typography variant="h6" sx={{ fontWeight: 600, color: 'primary.main' }}>
                            {request.event.title}
                          </Typography>
                          <Chip
                            label={request.status}
                            color={getStatusColor(request.status)}
                            sx={{
                              fontWeight: 600,
                              background: request.status === 'approved'
                                ? 'linear-gradient(45deg, #4ECDC4 30%, #45B7D1 90%)'
                                : request.status === 'pending'
                                ? 'linear-gradient(45deg, #FFD166 30%, #FF6B6B 90%)'
                                : 'linear-gradient(45deg, #FF6B6B 30%, #FF8E53 90%)',
                              color: 'white',
                            }}
                          />
                        </Box>
                        <Typography variant="subtitle1" sx={{ mb: 1, color: 'secondary.main', fontWeight: 500 }}>
                          Category: {request.category}
                        </Typography>
                        <Typography variant="body2" sx={{ mb: 2 }}>
                          {request.proposal}
                        </Typography>
                        <Divider sx={{ my: 2 }} />
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <Typography variant="body2" sx={{ fontWeight: 500 }}>
                            Price: ${request.price}
                          </Typography>
                          <Button
                            size="small"
                            sx={{
                              color: 'primary.main',
                              fontWeight: 600,
                              '&:hover': {
                                background: 'rgba(78,205,196,0.08)'
                              }
                            }}
                            onClick={() => navigate(`/events/${request.event._id}`)}
                          >
                            View Event
                          </Button>
                        </Box>
                      </CardContent>
                    </Card>
                  </Grid>
                ))}
              </Grid>
            ) : (
              <>
                {loading ? (
                  <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
                    <Typography>Loading your events...</Typography>
                  </Box>
                ) : events.length === 0 ? (
                  <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
                    <Typography>You haven't created any events yet.</Typography>
                  </Box>
                ) : (
                  <Grid container spacing={3}>
                    {events.map((event) => (
                      <Grid item key={event._id} xs={12} md={6}>
                        <Card
                          sx={{
                            borderRadius: 3,
                            boxShadow: '0 4px 24px 0 rgba(255,107,107,0.10)',
                            transition: 'transform 0.2s, box-shadow 0.2s',
                            '&:hover': {
                              transform: 'translateY(-6px) scale(1.02)',
                              boxShadow: '0 8px 32px 0 rgba(255,107,107,0.18)',
                            },
                          }}
                        >
                          <CardContent>
                            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                              <Typography variant="h6" sx={{ fontWeight: 600, color: 'primary.main' }}>
                                {event.title}
                              </Typography>
                              <Chip
                                label={event.status}
                                color={getStatusColor(event.status)}
                                sx={{
                                  fontWeight: 600,
                                  background: event.status === 'approved'
                                    ? 'linear-gradient(45deg, #4ECDC4 30%, #45B7D1 90%)'
                                    : event.status === 'pending'
                                    ? 'linear-gradient(45deg, #FFD166 30%, #FF6B6B 90%)'
                                    : 'linear-gradient(45deg, #FF6B6B 30%, #FF8E53 90%)',
                                  color: 'white',
                                }}
                              />
                            </Box>
                            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                              {format(new Date(event.date), 'MMMM d, yyyy')}
                            </Typography>
                            <Typography variant="body2" sx={{ mb: 2 }}>
                              {event.description.substring(0, 100)}...
                            </Typography>
                            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                              <Typography variant="body2" sx={{ fontWeight: 500 }}>
                                {event.vendorRequirements.length} vendor requirements
                              </Typography>
                              <Button
                                size="small"
                                sx={{
                                  color: 'primary.main',
                                  fontWeight: 600,
                                  '&:hover': {
                                    background: 'rgba(255,107,107,0.08)'
                                  }
                                }}
                                onClick={() => navigate(`/events/${event._id}`)}
                              >
                                View Details
                              </Button>
                            </Box>
                          </CardContent>
                        </Card>
                      </Grid>
                    ))}
                  </Grid>
                )}
              </>
            )}
          </Box>
          <Box sx={{ minWidth: isDesktop ? 320 : 'auto', mb: isDesktop ? 0 : 3 }}>
            <Paper elevation={3} sx={{ p: 2, borderRadius: 3 }}>
              <Typography variant="h6" sx={{ mb: 2, fontWeight: 600, color: 'primary.main' }}>Event Calendar</Typography>
              <LocalizationProvider dateAdapter={AdapterDateFns}>
                <StaticDatePicker
                  displayStaticWrapperAs="desktop"
                  value={calendarDate}
                  onChange={setCalendarDate}
                  renderDay={(day, _value, DayComponentProps) => {
                    const hasEvent = eventDates.some(date => isSameDay(day, date));
                    return (
                      <PickersDay
                        {...DayComponentProps}
                        sx={hasEvent ? { background: 'linear-gradient(45deg, #FF6B6B 30%, #FF8E53 90%)', color: 'white', borderRadius: 2 } : {}}
                      />
                    );
                  }}
                  showDaysOutsideCurrentMonth
                  fixedWeekNumber={false}
                />
              </LocalizationProvider>
            </Paper>
          </Box>
        </Box>
      </Container>
    </Box>
  );
};

export default Dashboard; 