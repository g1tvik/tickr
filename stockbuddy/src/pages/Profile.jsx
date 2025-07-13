import React from 'react';
import './Profile.css';

const mockUser = {
  name: "Akash K",
  username: "@AkashK84925",
  joined: "2022",
  avatar: "https://ui-avatars.com/api/?name=Akash+K&background=333&color=fff&size=128",
  totalValue: "$0.59",
  holdings: "$0.00",
  cash: "$0.59",
  crypto: "$0.00",
  overview: [
    { label: "Stocks", value: "0%" },
    { label: "ETFs", value: "0%" },
    { label: "Options", value: "0%" },
    { label: "Crypto", value: "0%" }
  ]
};

function Profile() {
  return (
    <div className="profile-page-center pt-4">
      <div className="profile-card">
        <img src={mockUser.avatar} alt="avatar" className="profile-avatar" />
        <h2 className="profile-name">{mockUser.name}</h2>
        <div className="profile-username">{mockUser.username} · Joined {mockUser.joined}</div>
        <a href="#" className="profile-edit">Edit profile</a>
        <div className="profile-total-value">{mockUser.totalValue}</div>
        <div className="profile-total-label">Total in Tickr</div>
        <div className="profile-investing-section">
          <div className="profile-investing-title">Individual investing</div>
          <div className="profile-divider"></div>
          <div className="profile-investing-row">
            <span>Total individual value</span>
            <span className="profile-investing-value">{mockUser.totalValue}</span>
          </div>
          <div className="profile-investing-row">
            <span>Individual holdings</span>
            <span>{mockUser.holdings}</span>
          </div>
          <div className="profile-investing-row">
            <span>Individual cash</span>
            <span>{mockUser.cash}</span>
          </div>
          <div className="profile-investing-row">
            <span>Crypto holdings</span>
            <span>{mockUser.crypto}</span>
          </div>
        </div>
        <div className="profile-overview-section">
          <div className="profile-overview-title">Overview</div>
          <div className="profile-overview-circles">
            {mockUser.overview.map((item, idx) => (
              <div key={idx} className={`profile-overview-circle${idx === 0 ? ' profile-overview-circle-active' : ''}`}>
                <div>{item.label}</div>
                <div className="profile-overview-value">{item.value}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

export default Profile; 