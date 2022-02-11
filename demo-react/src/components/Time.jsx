import React, { useEffect, useState } from 'react';

const TimeDate = ({ dateTime }) => {
  const [time, setTime] = useState('');

  const timeValidate = (timestamp) => {
    const date = new Date(timestamp).toLocaleDateString() + ' ' + new Date(timestamp).toLocaleTimeString();
    setTime(date);
  };
  useEffect(() => {
    if (dateTime) {
      timeValidate(dateTime);
    }
  }, [dateTime]);
  return <>{time}</>;
};
export default TimeDate;
