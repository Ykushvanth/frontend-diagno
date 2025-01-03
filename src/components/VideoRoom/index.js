import React, { useState, useEffect, useRef } from 'react';
import { useParams, useHistory } from 'react-router-dom';
import Cookies from 'js-cookie';
import './index.css';

const VideoRoom = () => {
    const { meeting_id } = useParams();
    const history = useHistory();
    
    // Get user details from localStorage
    const userDetails = localStorage.getItem('userDetails');
    const doctorDetails = localStorage.getItem('doctorDetails');
    const role = doctorDetails ? 'doctor' : 'patient';

    // Refs
    const webSocket = useRef(null);
    const localVideoRef = useRef(null);
    const remoteVideoRef = useRef(null);
    const localStream = useRef(null);
    const peerConnection = useRef(null);

    // State
    const [debugInfo, setDebugInfo] = useState('Initializing...');
    const [status, setStatus] = useState('connecting');
    const [error, setError] = useState(null);
    const [isConnected, setIsConnected] = useState(false);
    const [retryCount, setRetryCount] = useState(0);

    const connectToWebSocket = () => {
        try {
            setDebugInfo(`Connecting as ${role} to meeting ${meeting_id}...`);
            console.log(`Attempting to connect as ${role}...`);
            
            // Update WebSocket URL to match your server port
            const wsUrl = 'ws://localhost:3001/ws';
            webSocket.current = new WebSocket(wsUrl);

            webSocket.current.onopen = () => {
                console.log(`WebSocket Connected as ${role}`);
                setDebugInfo(`Connected as ${role}, joining meeting...`);
                setStatus('connected to signaling server');
                
                const joinMessage = {
                    type: 'join',
                    meeting_id: meeting_id,
                    role: role
                };
                console.log('Sending join message:', joinMessage);
                webSocket.current.send(JSON.stringify(joinMessage));
            };

            webSocket.current.onmessage = async (event) => {
                try {
                    const data = JSON.parse(event.data);
                    console.log(`[${role}] Received message:`, data);
                    setDebugInfo(`[${role}] Received: ${data.type}`);
                    await handleMessage(data);
                } catch (error) {
                    console.error('Error handling message:', error);
                    setDebugInfo(`Error handling message: ${error.message}`);
                }
            };

            webSocket.current.onerror = (error) => {
                console.error(`[${role}] WebSocket Error:`, error);
                setDebugInfo(`[${role}] Connection error`);
                setError(`Connection error for ${role}. Please try again.`);
            };

            webSocket.current.onclose = (event) => {
                console.log(`[${role}] WebSocket closed:`, event.code, event.reason);
                setDebugInfo(`[${role}] Connection closed`);
                setStatus('disconnected');
                
                if (retryCount < 3) {
                    const retryDelay = 2000;
                    console.log(`[${role}] Retrying in ${retryDelay}ms...`);
                    setDebugInfo(`[${role}] Retrying connection...`);
                    setTimeout(() => {
                        setRetryCount(prev => prev + 1);
                        connectToWebSocket();
                    }, retryDelay);
                } else {
                    setError(`Unable to maintain connection for ${role}. Please try again.`);
                }
            };
        } catch (error) {
            console.error(`[${role}] Error creating WebSocket:`, error);
            setDebugInfo(`[${role}] Failed to create connection`);
            setError(`Failed to establish connection for ${role}.`);
        }
    };

    const handleMessage = async (data) => {
        try {
            console.log(`[${role}] Processing message:`, data);
            switch (data.type) {
                case 'welcome':
                    setDebugInfo(`Received welcome message`);
                    break;
                case 'peer_joined':
                    console.log(`Peer joined as ${data.peerRole}`);
                    setDebugInfo(`Peer joined as ${data.peerRole}`);
                    setStatus('peer connected');
                    break;
                case 'error':
                    console.error('Received error:', data.message);
                    setError(data.message);
                    break;
                default:
                    console.log('Unknown message type:', data.type);
            }
        } catch (error) {
            console.error('Error handling message:', error);
            setDebugInfo(`Error handling message: ${error.message}`);
        }
    };

    const startVideoStream = async () => {
        try {
            localStream.current = await navigator.mediaDevices.getUserMedia({ video: true });
            localVideoRef.current.srcObject = localStream.current;

            // Send the video stream to the WebSocket server
            const videoMessage = {
                type: 'video',
                meeting_id: meeting_id,
                stream: localStream.current // Send the stream
            };
            webSocket.current.send(JSON.stringify(videoMessage));
        } catch (error) {
            console.error('Error accessing media devices.', error);
        }
    };

    // Call this function when the WebSocket connection is established
    webSocket.current.onopen = () => {
        startVideoStream();
    };

    useEffect(() => {
        console.log(`Initializing ${role} connection for meeting ${meeting_id}`);
        if (!meeting_id || meeting_id === 'undefined') {
            setError('Invalid meeting ID');
            return;
        }

        connectToWebSocket();

        return () => {
            console.log(`Cleaning up ${role} connection`);
            if (webSocket.current) {
                webSocket.current.close();
            }
        };
    }, [meeting_id]); // eslint-disable-line react-hooks/exhaustive-deps

    if (!meeting_id) {
        return <div>Invalid meeting ID</div>;
    }

    return (
        <div className="video-room">
            <div className="connection-info">
                <p>Role: {role}</p>
                <p>Meeting ID: {meeting_id}</p>
                <p>Status: {status}</p>
                <p>Debug: {debugInfo}</p>
            </div>
            {error ? (
                <div className="error-container">
                    <h3>Error</h3>
                    <p>{error}</p>
                    <button onClick={() => {
                        setError(null);
                        setRetryCount(0);
                        connectToWebSocket();
                    }}>
                        Retry Connection
                    </button>
                    <button onClick={() => {
                        history.push('/booking-history');
                    }}>
                        Return to Appointments
                    </button>
                </div>
            ) : (
                <div className="video-container">
                    <video
                        ref={localVideoRef}
                        autoPlay
                        playsInline
                        muted
                        className="local-video"
                    />
                    <video
                        ref={remoteVideoRef}
                        autoPlay
                        playsInline
                        className="remote-video"
                    />
                </div>
            )}
        </div>
    );
};

export default VideoRoom; 