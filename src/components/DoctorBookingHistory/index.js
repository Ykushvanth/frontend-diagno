import React from 'react';
import { Link } from 'react-router-dom';

const DoctorBookingHistory = ({ appointments }) => {
    const renderAppointmentAction = (appointment) => {
        if (isAppointmentTime(appointment.date, appointment.time)) {
            return (
                <Link 
                    to={`/doctor/video-room/${appointment.meeting_id}`}
                    className="join-call-button"
                >
                    Join Video Call
                </Link>
            );
        }
    };

    return (
        <div>
            {appointments.map((appointment) => (
                <div key={appointment.id}>
                    {/* Render appointment details */}
                    {renderAppointmentAction(appointment)}
                </div>
            ))}
        </div>
    );
};

export default DoctorBookingHistory;