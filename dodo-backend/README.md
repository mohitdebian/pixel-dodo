# Pixel Magic - AI Image Generation Platform

A web application that allows users to generate AI images using credits. Built with React, Firebase, and Dodo Payments integration.

## Features

- User authentication with Firebase
- Credit-based system for image generation
- Secure payment processing with Dodo Payments
- Real-time credit updates
- Responsive design

## Prerequisites

- Node.js (v14 or higher)
- Firebase account
- Dodo Payments account

## Environment Variables

Create a `.env` file in the root directory with the following variables:

```env
# Firebase
REACT_APP_FIREBASE_API_KEY=your_api_key
REACT_APP_FIREBASE_AUTH_DOMAIN=your_auth_domain
REACT_APP_FIREBASE_PROJECT_ID=your_project_id
REACT_APP_FIREBASE_STORAGE_BUCKET=your_storage_bucket
REACT_APP_FIREBASE_MESSAGING_SENDER_ID=your_messaging_sender_id
REACT_APP_FIREBASE_APP_ID=your_app_id

# Dodo Payments
DODO_API_KEY=your_dodo_api_key
DODO_WEBHOOK_SECRET=your_webhook_secret
```

## Installation

1. Clone the repository:
```bash
git clone https://github.com/yourusername/pixel-magic.git
cd pixel-magic
```

2. Install dependencies:
```bash
npm install
```

3. Start the development server:
```bash
npm run dev
```

## Project Structure

```
pixel-magic/
├── src/
│   ├── components/     # React components
│   ├── pages/         # Page components
│   ├── services/      # API and service functions
│   └── utils/         # Utility functions
├── public/            # Static files
└── dodo-backend/      # Payment processing backend
```

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the LICENSE file for details.
