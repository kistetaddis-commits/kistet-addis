import React from "react";
import { useParams, useNavigate } from "react-router-dom";
import EventDetails from "./EventDetails";

const EventDetailsPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  if (!id) {
    return <div className="p-10 text-center">Event not found</div>;
  }

  return (
    <EventDetails
      eventId={id}
      onBack={() => navigate(-1)}
    />
  );
};

export default EventDetailsPage;