import React, { useEffect, useState } from 'react';

const TimeDate = ({ dateTime }) => {
  const [time, setTime] = useState({
    days: '00',
    hours: '00',
    minutes: '00',
    seconds: '00',
  });

  const transformNumber = (value) => {
    let strValue = value.toString();
    const strLength = strValue.length;
    if (strLength === 1) {
      strValue = '0' + strValue;
    }
    return strValue;
  };

  const timeValidate = (distance) => {
    const arr = {};

    arr.days = Math.floor(distance / (1000 * 60 * 60 * 24));
    arr.hours = Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    arr.minutes = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60));
    arr.seconds = Math.floor((distance % (1000 * 60)) / 1000);
    setTime(arr);
    console.log(arr);
  };

  useEffect(() => {
    if (dateTime) {
      timeValidate();
    }
  }, [dateTime]);
  return <>{time.days}</>;
};
export default TimeDate;
