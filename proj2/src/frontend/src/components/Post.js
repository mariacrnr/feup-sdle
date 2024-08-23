import React, { useEffect, useState } from 'react';
import {
    MDBCard,
    MDBCardBody,
    MDBCardImage,
    MDBIcon,
    MDBTypography,
    MDBCardHeader,
  } from "mdb-react-ui-kit";

import "../style/Post.css";

export default function Post({ post, username }) {
    const [time, setTime] = useState(post.timestamp);
    useEffect(() => {
        setTime(timeAgo(post.timestamp));
    }, [post.timestamp]);

    const MONTH_NAMES = [
        'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
        'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro',
    ];
    
    const getFormattedDate = (date, prefomattedDate = false, hideYear = false) => {
        const day = date.getDate();
        const month = MONTH_NAMES[date.getMonth()];
        const year = date.getFullYear();
        const hours = date.getHours();
        let minutes = date.getMinutes();
    
        if (minutes < 10) {
          // Adding leading zero to minutes
          minutes = `0${minutes}`;
        }
    
        if (prefomattedDate) {
          // Today at 10:20
          // Yesterday at 10:20
          return `${prefomattedDate} at ${hours}:${minutes}`;
        }
    
        if (hideYear) {
          // 10. January at 10:20
          return `${day} de ${month} às ${hours}:${minutes}`;
        }
    
        // 10. January 2017. at 10:20
        return `${day} de ${month} ${year} às ${hours}:${minutes}`;
    };
    
    const timeAgo = (dateParam) => {
        if (!dateParam) {
          return null;
        }
    
        const date = typeof dateParam === 'object' ? dateParam : new Date(dateParam);
        const DAY_IN_MS = 86400000; // 24 * 60 * 60 * 1000
        const today = new Date();
        const yesterday = new Date(today - DAY_IN_MS);
        const seconds = Math.round((today - date) / 1000);
        const minutes = Math.round(seconds / 60);
        const isToday = today.toDateString() === date.toDateString();
        const isYesterday = yesterday.toDateString() === date.toDateString();
        const isThisYear = today.getFullYear() === date.getFullYear();
        let message = '';
    
        if (seconds < 5) {
          message = 'now';
        } else if (seconds < 60) {
          message = `${seconds} seconds ago`;
        } else if (seconds < 90) {
          message = 'about a minute ago';
        } else if (minutes < 60) {
          message = `${minutes} minutes ago`;
        } else if (isToday) {
          message = getFormattedDate(date, 'Today'); // Today at 10:20
        } else if (isYesterday) {
          message = getFormattedDate(date, 'Yesterday'); // Yesterday at 10:20
        } else if (isThisYear) {
          message = getFormattedDate(date, false, true); // 10. January at 10:20
        } else {
          message = getFormattedDate(date); // 10. January 2017. at 10:20
        }
        return message;
    };
  return (
    <MDBCard className="text-dark w-50 mb-3" key={post.username}>
        <MDBCardHeader className="pt-4 pe-4 ps-4">
            <div className="d-flex flex-start">
                <MDBCardImage
                    className="rounded-circle shadow-1-strong me-3"
                    src="https://source.unsplash.com/random/200x200?sig=incrementingIdentifier"
                    alt="avatar"
                    width="40"
                    height="40"
                />
                <div>
                    <MDBTypography tag="h6" className="fw-bold mb-1">
                        {username}
                    </MDBTypography>
                    <div className="d-flex align-items-center mb-3">
                        <small className="mb-0">
                            {time}
                        </small>
                        <a href="#!" className="link-muted">
                            <MDBIcon fas icon="pencil-alt ms-2" />
                        </a>
                        <a href="#!" className="link-muted">
                            <MDBIcon fas icon="redo-alt ms-2" />
                        </a>
                        <a href="#!" className="link-muted">
                            <MDBIcon fas icon="heart ms-2" />
                        </a>
                    </div>
                </div>
            </div>
        </MDBCardHeader>
        <MDBCardBody className="pt-4 pe-4 ps-4">
          <p className="ms-3">
            {post.message}
          </p>
        </MDBCardBody>
    </MDBCard>
  );
}