import React, { useState, useEffect, useRef } from 'react';
import { useParams, useHistory, useLocation } from 'react-router-dom';
import Cookies from 'js-cookie';
import './index.css';

const VideoRoom = () => {
    const { meeting_id } = useParams();
    const history = useHistory();
    const location = useLocation();
    
    const isDoctor = location.pathname.startsWith('/doctor/');
    const role = isDoctor ? 'doctor' : 'patient';

    const webSocket = useRef(null);
    const localVideoRef = useRef(null);
    const remoteVideoRef = useRef(null);
    const localStream = useRef(null);
    const [debugInfo, setDebugInfo] = useState('Initializing...');
    const [status, setStatus] = useState('connecting');
    const [error, setError] = useState(null);
    const [retryCount, setRetryCount] = useState(0);

    const connectToWebSocket = () => {
        const wsUrl = isDoctor 
            ? 'wss://doctors-frontend-diango.vercel.app/ws'
            : 'wss://frontend-diagno.vercel.app/ws';
        webSocket.current = new WebSocket(wsUrl);

        webSocket.current.onopen = () => {
            console.log(`WebSocket Connected as ${role}`);
            setDebugInfo(`Connected as ${role}, joining meeting...`);
            const joinMessage = { type: 'join', meeting_id, role };
            webSocket.current.send(JSON.stringify(joinMessage));
            startVideoStream(); // Start video stream when connected
        };

        webSocket.current.onmessage = (event) => {
            const data = JSON.parse(event.data);
            handleMessage(data);
        };

        webSocket.current.onerror = (error) => {
            console.error(`WebSocket Error:`, error);
            setError(`Connection error for ${role}. Please try again.`);
        };

        webSocket.current.onclose = () => {
            console.log(`WebSocket closed`);
            setStatus('disconnected');
        };
    };

    const startVideoStream = async () => {
        try {
            localStream.current = await navigator.mediaDevices.getUserMedia({ video: true });
            localVideoRef.current.srcObject = localStream.current;

            // Send the video stream to the WebSocket server
            const videoMessage = {
                type: 'video',
                meeting_id,
                stream: localStream.current // Send the stream
            };
            webSocket.current.send(JSON.stringify(videoMessage));
        } catch (error) {
            console.error('Error accessing media devices.', error);
            setError('Unable to access camera.');
        }
    };

    const handleMessage = (data) => {
        switch (data.type) {
            case 'peer_joined':
                console.log(`Peer joined as ${data.peerRole}`);
                setStatus('peer connected');
                break;
            case 'video':
                // Handle incoming video stream
                if (data.stream) {
                    const remoteStream = new MediaStream();
                    const videoTrack = data.stream.getTracks()[0]; // Assuming the stream contains video tracks
                    remoteStream.addTrack(videoTrack);
                    remoteVideoRef.current.srcObject = remoteStream; // Set the remote video element's source
                }
                break;
            case 'error':
                console.error('Received error:', data.message);
                setError(data.message);
                break;
            default:
                console.log('Unknown message type:', data.type);
        }
    };

    useEffect(() => {
        connectToWebSocket();
        return () => {
            if (webSocket.current) {
                webSocket.current.close();
            }
        };
    }, [meeting_id]);

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
                        connectToWebSocket();
                    }}>
                        Retry Connection
                    </button>
                </div>
            ) : (
                <div className="video-container">
                    <video ref={localVideoRef} autoPlay playsInline muted className="local-video" />
                    <video ref={remoteVideoRef} autoPlay playsInline className="remote-video" />
                </div>
            )}
        </div>
    );
};

export default VideoRoom; 