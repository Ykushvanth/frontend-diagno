import { useState, useEffect } from 'react';
import { useHistory } from 'react-router-dom';
import Cookies from 'js-cookie';
import Header from "../Header/Header";
// import Header from '../Header';
import './index.css';
import { Link } from 'react-router-dom';
import jsPDF from 'jspdf';
import { FaFilePrescription, FaDownload } from 'react-icons/fa';

const formatMonth = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleString('default', { month: 'short' });
};

const formatDay = (dateString) => {
    const date = new Date(dateString);
    return date.getDate();
};

const formatTime = (timeString) => {
    const [hours, minutes] = timeString.split(':');
    const time = new Date();
    time.setHours(hours);
    time.setMinutes(minutes);
    return time.toLocaleString('en-US', { 
        hour: 'numeric', 
        minute: 'numeric', 
        hour12: true 
    });
};

const BookingHistory = () => {
    const [appointments, setAppointments] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [filter, setFilter] = useState('all');
    const history = useHistory();
    const [showPrescriptionModal, setShowPrescriptionModal] = useState(false);
    const [selectedAppointment, setSelectedAppointment] = useState(null);

    useEffect(() => {
        const token = Cookies.get('jwt_token');
        if (!token) {
            history.push('/login');
            return;
        }
        fetchAppointments();
    }, [history]);

    const fetchAppointments = async () => {
        try {
            const token = Cookies.get('jwt_token');
            const response = await fetch('https://backend-diagno.onrender.com/booking-history', {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
            }

            const data = await response.json();
            setAppointments(data);
            setLoading(false);
        } catch (error) {
            console.error('Error fetching appointments:', error);
            setError(error.message);
            setLoading(false);
        }
    };

    const filteredAppointments = appointments.filter(appointment => {
        if (filter === 'all') return true;
        return appointment.status.toLowerCase() === filter;
    });

    const isAppointmentTime = (date, time) => {
        const appointmentDateTime = new Date(`${date}T${time}`);
        const now = new Date();
        
        // Enable button 5 minutes before and up to 30 minutes after appointment time
        const timeDifferenceInMinutes = (now - appointmentDateTime) / (1000 * 60);
        return timeDifferenceInMinutes >= -5 && timeDifferenceInMinutes <= 30;
    };

    const downloadPrescription = (appointment) => {
        const doc = new jsPDF();
        
        // Add header
        doc.setFontSize(20);
        doc.text('Medical Prescription', 105, 20, { align: 'center' });
        
        // Add appointment details
        doc.setFontSize(12);
        doc.text([
            `Date: ${new Date(appointment.date).toLocaleDateString()}`,
            `Patient Name: ${appointment.patient_name}`,
            `Doctor: Dr. ${appointment.doctor_name}`,
            `Specialist: ${appointment.specialist}`,
            '\nPrescription:',
            `${appointment.prescription}`
        ], 20, 40);

        // Save the PDF
        doc.save(`prescription-${appointment.date}.pdf`);
    };

    const renderPrescriptionModal = () => {
        if (!showPrescriptionModal || !selectedAppointment) return null;

        return (
            <div className="modal-overlay">
                <div className="prescription-modal">
                    <div className="prescription-header">
                        <h2>Prescription Details</h2>
                        <button 
                            className="download-button"
                            onClick={() => downloadPrescription(selectedAppointment)}
                        >
                            <FaDownload /> Download PDF
                        </button>
                    </div>
                    
                    <div className="prescription-content">
                        <div className="prescription-info">
                            <p><strong>Date:</strong> {new Date(selectedAppointment.date).toLocaleDateString()}</p>
                            <p><strong>Doctor:</strong> Dr. {selectedAppointment.doctor_name}</p>
                            <p><strong>Specialist:</strong> {selectedAppointment.specialist}</p>
                        </div>
                        
                        <div className="prescription-text">
                            <h3>Prescription:</h3>
                            <p>{selectedAppointment.prescription || 'No prescription available'}</p>
                        </div>
                    </div>

                    <button 
                        className="close-button"
                        onClick={() => setShowPrescriptionModal(false)}
                    >
                        Close
                    </button>
                </div>
            </div>
        );
    };

    if (loading) return (
        <>
            {/* <Header /> */}
            <div className="loading-container">
                <div className="loader"></div>
                <p>Loading your appointments...</p>
            </div>
        </>
    );

    return (
        <div className="page-wrapper">
            { <Header /> }
            <div className="booking-container">
                <div className="booking-header">
                    <h1>My Appointments</h1>
                </div>

                <div className="filter-tabs">
                    <button 
                        className={`tab ${filter === 'all' ? 'active' : ''}`}
                        onClick={() => setFilter('all')}
                    >
                        All
                    </button>
                    <button 
                        className={`tab ${filter === 'upcoming' ? 'active' : ''}`}
                        onClick={() => setFilter('upcoming')}
                    >
                        Upcoming
                    </button>
                    <button 
                        className={`tab ${filter === 'completed' ? 'active' : ''}`}
                        onClick={() => setFilter('completed')}
                    >
                        Completed
                    </button>
                </div>

                <div className="appointments-grid">
                    {filteredAppointments.map((appointment) => (
                        <div key={appointment.id} className="appointment-card">
                            <div className={`status-bar ${appointment.status.toLowerCase()}`}></div>
                            <div className="card-content">
                                <div className="date-time">
                                    <div className="date">
                                        <span className="month">{formatMonth(appointment.date)}</span>
                                        <span className="day">{formatDay(appointment.date)}</span>
                                    </div>
                                    <div className="time">
                                        <i className="far fa-clock"></i>
                                        {formatTime(appointment.time)}
                                    </div>
                                </div>

                                <div className="doctor-info">
                                    <div className="avatar">
                                        {appointment.doctor_name.charAt(0)}
                                    </div>
                                    <div>
                                        <h3>Dr. {appointment.doctor_name}</h3>
                                        <p>{appointment.specialist}</p>
                                    </div>
                                </div>

                                <div className="location">
                                    <i className="fas fa-map-marker-alt"></i>
                                    {appointment.location}
                                </div>

                                {appointment.prescription && (
                                    <div className="prescription-section">
                                        <button
                                            className="prescription-view-btn"
                                            onClick={() => {
                                                setSelectedAppointment(appointment);
                                                setShowPrescriptionModal(true);
                                            }}
                                        >
                                            <FaFilePrescription /> View Prescription
                                        </button>
                                        <button
                                            className="prescription-download-btn"
                                            onClick={() => downloadPrescription(appointment)}
                                        >
                                            <FaDownload /> Download
                                        </button>
                                    </div>
                                )}

                                {appointment.mode === 'Online' && (
                                    <div className="video-call-section">
                                        {isAppointmentTime(appointment.date, appointment.time) ? (
                                            <Link 
                                                to={`/video-consultation/${appointment.meeting_id}`}
                                                className="join-call-button"
                                            >
                                                Join Video Call
                                            </Link>
                                        ) : (
                                            <button
                                                className="join-video-btn disabled"
                                                disabled
                                            >
                                                {new Date(`${appointment.date}T${appointment.time}`) > new Date() 
                                                    ? 'Consultation Not Started Yet'
                                                    : 'Consultation Ended'}
                                            </button>
                                        )}
                                    </div>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
                {renderPrescriptionModal()}
            </div>
        </div>
    );
};

export default BookingHistory;