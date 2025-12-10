/**
 * @fileoverview KYC Controller
 */

const KYC = require('../models/KYC');

exports.getKYCStatus = async (req, res) => {
  try {
    const sellerId = req.seller?._id || req.user?.seller?._id || req.query.sellerId;
    let kyc = await KYC.findOne({ sellerId });
    
    if (!kyc) {
      kyc = await KYC.create({ sellerId, personalInfo: { fullName: '', pan: '', email: '', phone: '' } });
    }

    res.status(200).json({ success: true, data: kyc });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to fetch KYC status', error: error.message });
  }
};

exports.updateKYC = async (req, res) => {
  try {
    const sellerId = req.seller?._id || req.user?.seller?._id || req.body.sellerId;
    let kyc = await KYC.findOne({ sellerId });

    if (!kyc) {
      kyc = await KYC.create({ ...req.body, sellerId });
    } else {
      Object.assign(kyc, req.body);
      kyc.status = 'incomplete';
      await kyc.save();
    }

    res.status(200).json({ success: true, message: 'KYC updated successfully', data: kyc });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to update KYC', error: error.message });
  }
};

exports.submitKYC = async (req, res) => {
  try {
    const sellerId = req.seller?._id || req.user?.seller?._id;
    const kyc = await KYC.findOne({ sellerId });

    if (!kyc) return res.status(404).json({ success: false, message: 'KYC not found' });

    kyc.status = 'submitted';
    await kyc.save();

    res.status(200).json({ success: true, message: 'KYC submitted for verification', data: kyc });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to submit KYC', error: error.message });
  }
};

exports.uploadDocument = async (req, res) => {
  try {
    const { type, url } = req.body;
    const sellerId = req.seller?._id || req.user?.seller?._id;
    const kyc = await KYC.findOne({ sellerId });

    if (!kyc) return res.status(404).json({ success: false, message: 'KYC not found' });

    kyc.documents.push({ type, url });
    await kyc.save();

    res.status(200).json({ success: true, message: 'Document uploaded successfully', data: kyc });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to upload document', error: error.message });
  }
};
