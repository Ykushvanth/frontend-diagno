import React, { useState } from 'react';

const DoctorDashboard = () => {
    const [appointments, setAppointments] = useState([]);

    const isAppointmentTime = (appointment) => {
        const now = new Date();
        const appointmentDateTime = new Date(`${appointment.date} ${appointment.time}`);
        const fiveMinutesBefore = new Date(appointmentDateTime.getTime() - 5 * 60000);
        const thirtyMinutesAfter = new Date(appointmentDateTime.getTime() + 30 * 60000);
        
        return now >= fiveMinutesBefore && now <= thirtyMinutesAfter;
    };

    return (
        <div className="doctor-dashboard">
            <h2>Today's Appointments</h2>
            {appointments.map(appointment => (
                <div key={appointment.id} className="appointment-card">
                    <div className="patient-details">
                        <h3>{appointment.patient_name}</h3>
                        <p>Time: {appointment.time}</p>
                        <p>Mode: {appointment.mode}</p>
                    </div>
                    {appointment.mode === 'Online' && isAppointmentTime(appointment) && (
                        <button 
                            onClick={() => handleStartCall(appointment.id)}
                            className="start-call-btn"
                        >
                            Start Video Call
                        </button>
                    )}
                </div>
            ))}
        </div>
    );
};

export default DoctorDashboard; 