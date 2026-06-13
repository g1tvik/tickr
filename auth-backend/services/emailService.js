const nodemailer = require('nodemailer');

// Create a test account for development (you can replace with real SMTP settings)
const createTestAccount = async () => {
  try {
    const testAccount = await nodemailer.createTestAccount();
    return nodemailer.createTransport({
      host: 'smtp.ethereal.email',
      port: 587,
      secure: false,
      auth: {
        user: testAccount.user,
        pass: testAccount.pass,
      },
    });
  } catch (error) {
    console.error('Error creating test account:', error);
    return null;
  }
};

// For production, you would use real SMTP settings like Gmail or SendGrid
const createProductionTransporter = () => {
  return nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASSWORD,
    },
  });
};

const getTransporter = async () => {
  // Check if we have real email credentials
  if (process.env.EMAIL_USER && process.env.EMAIL_PASSWORD) {
    console.log('Using real email credentials');
    return createProductionTransporter();
  } else {
    console.log('Using Ethereal Email for testing');
    return await createTestAccount();
  }
};

const sendGoalReminder = async (userEmail, userName, dailyGoal, completedToday) => {
  try {
    const transporter = await getTransporter();
    if (!transporter) {
      console.error('Failed to create email transporter');
      return false;
    }

    const remaining = Math.max(dailyGoal - completedToday, 0);
    const progress = Math.min((completedToday / dailyGoal) * 100, 100);

    const mailOptions = {
      from: '"StockBuddy" <noreply@stockbuddy.com>',
      to: userEmail,
      subject: 'Your daily learning goal reminder',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; border-radius: 10px; text-align: center;">
            <h1 style="margin: 0; font-size: 28px;">StockBuddy</h1>
            <p style="margin: 10px 0 0 0; font-size: 16px; opacity: 0.9;">Your Daily Learning Reminder</p>
          </div>
          
          <div style="background: #f8f9fa; padding: 30px; border-radius: 10px; margin-top: 20px;">
            <h2 style="color: #333; margin-bottom: 20px;">Hello ${userName}!</h2>
            
            <div style="background: white; padding: 20px; border-radius: 8px; margin-bottom: 20px; border-left: 4px solid #667eea;">
              <h3 style="color: #333; margin-top: 0;">Today's Progress</h3>
              <div style="display: flex; justify-content: space-between; margin-bottom: 15px;">
                <span style="color: #666;">Completed Today:</span>
                <span style="font-weight: bold; color: #667eea;">${completedToday} lessons</span>
              </div>
              <div style="display: flex; justify-content: space-between; margin-bottom: 15px;">
                <span style="color: #666;">Daily Goal:</span>
                <span style="font-weight: bold; color: #333;">${dailyGoal} lessons</span>
              </div>
              <div style="display: flex; justify-content: space-between; margin-bottom: 15px;">
                <span style="color: #666;">Remaining:</span>
                <span style="font-weight: bold; color: ${remaining > 0 ? '#e74c3c' : '#27ae60'};">${remaining} lessons</span>
              </div>
              <div style="background: #e9ecef; height: 8px; border-radius: 4px; overflow: hidden; margin-top: 10px;">
                <div style="background: linear-gradient(90deg, #667eea, #764ba2); height: 100%; width: ${progress}%; transition: width 0.3s ease;"></div>
              </div>
              <div style="text-align: center; margin-top: 8px; font-size: 14px; color: #666;">
                ${progress.toFixed(1)}% Complete
              </div>
            </div>
            
            ${remaining > 0 ? `
              <div style="background: #fff3cd; border: 1px solid #ffeaa7; border-radius: 8px; padding: 15px; margin-bottom: 20px;">
                <h4 style="margin: 0 0 10px 0; color: #856404;">Keep going</h4>
                <p style="margin: 0; color: #856404;">You're ${remaining} lesson${remaining > 1 ? 's' : ''} away from your daily goal. Don't give up!</p>
              </div>
            ` : `
              <div style="background: #d4edda; border: 1px solid #c3e6cb; border-radius: 8px; padding: 15px; margin-bottom: 20px;">
                <h4 style="margin: 0 0 10px 0; color: #155724;">Congratulations</h4>
                <p style="margin: 0; color: #155724;">You've completed your daily goal! Great job!</p>
              </div>
            `}
            
            <div style="text-align: center;">
              <a href="${process.env.FRONTEND_URL || 'http://localhost:5173'}/learn" 
                 style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 12px 30px; text-decoration: none; border-radius: 25px; display: inline-block; font-weight: bold;">
                Continue Learning
              </a>
            </div>
          </div>
          
          <div style="text-align: center; margin-top: 20px; color: #666; font-size: 12px;">
            <p>This email was sent because you have notifications enabled in your StockBuddy settings.</p>
            <p>© 2024 StockBuddy. All rights reserved.</p>
          </div>
        </div>
      `,
    };

    const info = await transporter.sendMail(mailOptions);
    
    if (process.env.NODE_ENV !== 'production') {
      console.log('Preview URL: %s', nodemailer.getTestMessageUrl(info));
    }
    
    console.log('Goal reminder email sent to:', userEmail);
    return true;
  } catch (error) {
    console.error('Error sending goal reminder email:', error);
    return false;
  }
};

const sendWelcomeEmail = async (userEmail, userName) => {
  try {
    const transporter = await getTransporter();
    if (!transporter) {
      console.error('Failed to create email transporter');
      return false;
    }

    const mailOptions = {
      from: '"StockBuddy" <noreply@stockbuddy.com>',
      to: userEmail,
      subject: 'Welcome to StockBuddy',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; border-radius: 10px; text-align: center;">
            <h1 style="margin: 0; font-size: 28px;">Welcome to StockBuddy</h1>
            <p style="margin: 10px 0 0 0; font-size: 16px; opacity: 0.9;">Your journey to financial literacy starts here</p>
          </div>
          
          <div style="background: #f8f9fa; padding: 30px; border-radius: 10px; margin-top: 20px;">
            <h2 style="color: #333; margin-bottom: 20px;">Hello ${userName}!</h2>
            
            <p style="color: #666; line-height: 1.6; margin-bottom: 20px;">
              Welcome to StockBuddy! We're excited to help you learn about stock trading and investing in a safe, educational environment.
            </p>
            
            <div style="background: white; padding: 20px; border-radius: 8px; margin-bottom: 20px;">
              <h3 style="color: #333; margin-top: 0;">What you can do:</h3>
              <ul style="color: #666; line-height: 1.8;">
                <li>Learn through interactive lessons</li>
                <li>Practice with paper trading</li>
                <li>Set and track daily learning goals</li>
                <li>Earn XP and unlock achievements</li>
                <li>Build a virtual portfolio</li>
              </ul>
            </div>
            
            <div style="text-align: center;">
              <a href="${process.env.FRONTEND_URL || 'http://localhost:5173'}/learn" 
                 style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 12px 30px; text-decoration: none; border-radius: 25px; display: inline-block; font-weight: bold;">
                Start Learning
              </a>
            </div>
          </div>
          
          <div style="text-align: center; margin-top: 20px; color: #666; font-size: 12px;">
            <p>© 2024 StockBuddy. All rights reserved.</p>
          </div>
        </div>
      `,
    };

    const info = await transporter.sendMail(mailOptions);
    
    if (process.env.NODE_ENV !== 'production') {
      console.log('Preview URL: %s', nodemailer.getTestMessageUrl(info));
    }
    
    console.log('Welcome email sent to:', userEmail);
    return true;
  } catch (error) {
    console.error('Error sending welcome email:', error);
    return false;
  }
};

/**
 * Send waitlist confirmation email
 */
const sendWaitlistConfirmation = async (userEmail, userName) => {
  try {
    const transporter = await getTransporter();
    if (!transporter) {
      console.error('Failed to create email transporter');
      return false;
    }

    const mailOptions = {
      from: '"Tickr" <noreply@tickr.app>',
      to: userEmail,
      subject: "You're on the tickr waitlist",
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%); color: white; padding: 30px; border-radius: 10px; text-align: center;">
            <h1 style="margin: 0; font-size: 28px;">You're on the list</h1>
            <p style="margin: 10px 0 0 0; font-size: 16px; opacity: 0.9;">Tickr Early Access Waitlist</p>
          </div>
          
          <div style="background: #f8f9fa; padding: 30px; border-radius: 10px; margin-top: 20px;">
            <h2 style="color: #333; margin-bottom: 20px;">Hey ${userName}!</h2>
            
            <p style="color: #666; line-height: 1.6; margin-bottom: 20px;">
              Thanks for joining the Tickr waitlist! We're building something special for aspiring traders and investors, and you'll be among the first to experience it.
            </p>
            
            <div style="background: white; padding: 20px; border-radius: 8px; margin-bottom: 20px; border-left: 4px solid #667eea;">
              <h3 style="color: #333; margin-top: 0;">What happens next?</h3>
              <ul style="color: #666; line-height: 1.8; margin: 0; padding-left: 20px;">
                <li>We'll review your application</li>
                <li>You'll receive an invite when it's your turn</li>
                <li>Early users get special perks</li>
              </ul>
            </div>
            
            <p style="color: #666; line-height: 1.6;">
              In the meantime, follow us on social media to stay updated on our progress.
            </p>
          </div>
          
          <div style="text-align: center; margin-top: 20px; color: #666; font-size: 12px;">
            <p>© ${new Date().getFullYear()} Tickr. All rights reserved.</p>
          </div>
        </div>
      `,
    };

    const info = await transporter.sendMail(mailOptions);
    
    if (process.env.NODE_ENV !== 'production') {
      console.log('Preview URL: %s', nodemailer.getTestMessageUrl(info));
    }
    
    console.log('Waitlist confirmation email sent to:', userEmail);
    return true;
  } catch (error) {
    console.error('Error sending waitlist confirmation email:', error);
    return false;
  }
};

/**
 * Send invite email with token
 */
const sendInviteEmail = async (userEmail, inviteToken) => {
  try {
    const transporter = await getTransporter();
    if (!transporter) {
      console.error('Failed to create email transporter');
      return false;
    }

    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
    const redeemUrl = `${frontendUrl}/redeem?token=${inviteToken}`;

    const mailOptions = {
      from: '"Tickr" <noreply@tickr.app>',
      to: userEmail,
      subject: "Your tickr invite is here",
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; border-radius: 10px; text-align: center;">
            <h1 style="margin: 0; font-size: 28px;">You're in</h1>
            <p style="margin: 10px 0 0 0; font-size: 16px; opacity: 0.9;">Your Tickr Early Access Invite</p>
          </div>
          
          <div style="background: #f8f9fa; padding: 30px; border-radius: 10px; margin-top: 20px;">
            <h2 style="color: #333; margin-bottom: 20px;">Welcome to Tickr!</h2>
            
            <p style="color: #666; line-height: 1.6; margin-bottom: 20px;">
              Great news! You've been selected for early access to Tickr. Click the button below to activate your account and start your trading journey.
            </p>
            
            <div style="text-align: center; margin: 30px 0;">
              <a href="${redeemUrl}" 
                 style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 15px 40px; text-decoration: none; border-radius: 25px; display: inline-block; font-weight: bold; font-size: 16px;">
                Activate My Account
              </a>
            </div>
            
            <div style="background: white; padding: 15px; border-radius: 8px; margin-bottom: 20px;">
              <p style="color: #666; margin: 0; font-size: 14px;">
                <strong>Your invite code:</strong><br>
                <code style="background: #eee; padding: 5px 10px; border-radius: 4px; font-family: monospace;">${inviteToken}</code>
              </p>
            </div>
            
            <p style="color: #999; font-size: 12px; line-height: 1.6;">
              This invite is single-use and tied to this email address. If you didn't request this, please ignore this email.
            </p>
          </div>
          
          <div style="text-align: center; margin-top: 20px; color: #666; font-size: 12px;">
            <p>© ${new Date().getFullYear()} Tickr. All rights reserved.</p>
          </div>
        </div>
      `,
    };

    const info = await transporter.sendMail(mailOptions);
    
    if (process.env.NODE_ENV !== 'production') {
      console.log('Preview URL: %s', nodemailer.getTestMessageUrl(info));
    }
    
    console.log('Invite email sent to:', userEmail);
    return true;
  } catch (error) {
    console.error('Error sending invite email:', error);
    return false;
  }
};

module.exports = {
  sendGoalReminder,
  sendWelcomeEmail,
  sendWaitlistConfirmation,
  sendInviteEmail,
};
