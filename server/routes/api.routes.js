const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');

// Multer Config
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        // Save to external folder usually next to the executable
        cb(null, path.join(process.cwd(), 'public/uploads/'));
    },
    filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, uniqueSuffix + path.extname(file.originalname));
    }
});
const upload = multer({ storage: storage });

const clientController = require('../controllers/client_controller');
const productController = require('../controllers/product_controller');

// Clients
router.get('/clients', clientController.getAllClients);
router.post('/clients', clientController.createClient);
router.put('/clients/:id', clientController.updateClient);
router.delete('/clients/:id', clientController.deleteClient);
router.post('/clients/:id/toggle-access', clientController.toggleClientAccess);

// Products
router.get('/products', productController.getAllProducts);
router.post('/products', productController.createProduct);
router.put('/products/:id', productController.updateProduct);
router.delete('/products/:id', productController.deleteProduct);
// Color variants (pulseiras)
router.get('/products/:id/colors', productController.getColorVariants);
router.put('/products/:id/colors', productController.saveColorVariants);
router.patch('/products/colors/:id/debit', productController.debitColorVariant);
// Product cost history
router.get('/products/:id/costs', productController.getCostHistory);

// Orders
const orderController = require('../controllers/order_controller');
router.get('/orders', orderController.getAllOrders);
router.post('/orders', orderController.createOrder);
router.post('/orders/:id/attachments', upload.array('files', 10), orderController.uploadAttachments);
router.get('/orders/:id/items', orderController.getOrderItems);
router.put('/orders/:id/accept', orderController.acceptOrder);
router.put('/orders/:id/checklist', orderController.updateChecklist);
router.put('/orders/:id/reject', orderController.rejectOrder);
router.put('/orders/:id/finalize', orderController.finalizeOrder);
router.put('/orders/:id/move-status', orderController.moveOrderStatus);
router.post('/orders/:id/conclude', upload.single('pickup_photo'), orderController.concludeOrder);
router.get('/orders/archived', orderController.getArchivedOrders);
router.put('/orders/:id/archive', orderController.archiveOrder);
router.delete('/orders/:id', orderController.deleteOrder);

// Comments
router.get('/orders/:id/comments', orderController.getComments);
router.post('/orders/:id/comments', orderController.addComment);

// Reports
router.get('/reports/sales', orderController.getSalesReport);
router.get('/reports/client-orders/:clientId', orderController.getClientOrders);
router.get('/reports/client-financial/:clientId', orderController.getClientFinancial);
router.post('/reports/core-entry', orderController.createCoreEntry);
router.put('/reports/entry/:id', orderController.editFinancialEntry);
router.put('/orders/:id/launch-core', orderController.launchToCore);
router.put('/orders/:id/file-path', orderController.updateFilePath);
router.post('/orders/open-folder', orderController.openFolder);
// Material costs report
router.get('/reports/material-costs', orderController.getMaterialCostsReport);
// Delete individual material cost entry (admin only)
router.delete('/material-costs/:id', orderController.deleteMaterialCost);

// Stock
const stockController = require('../controllers/stock_controller');
router.get('/stock', stockController.getStockOverview);
router.post('/stock/adjust', stockController.adjustStock);
router.get('/stock/movements', stockController.getStockMovements);
router.put('/stock/min/:id', stockController.updateMinStock);

// Suppliers
const supplierController = require('../controllers/supplier_controller');
router.get('/suppliers', supplierController.getAllSuppliers);
router.post('/suppliers', supplierController.createSupplier);
router.put('/suppliers/:id', supplierController.updateSupplier);
router.delete('/suppliers/:id', supplierController.deleteSupplier);

// Purchase Requests
const purchaseController = require('../controllers/purchase_controller');
router.get('/purchases', purchaseController.getAllPurchases);
router.post('/purchases', purchaseController.createPurchase);
router.put('/purchases/:id/receive', purchaseController.receivePurchase);
router.put('/purchases/:id/cancel', purchaseController.cancelPurchase);
router.delete('/purchases/:id', purchaseController.deletePurchase);

// Open URL in Microsoft Edge (Windows only)
const { exec } = require('child_process');
router.post('/open-edge', (req, res) => {
    const { url } = req.body;
    if (!url || !url.startsWith('https://')) {
        return res.status(400).json({ error: 'URL inválida.' });
    }
    // Uses the microsoft-edge: protocol – if Edge is already open, opens in the existing window
    exec(`cmd /c start "" "microsoft-edge:${url}"`, (err) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json({ success: true });
    });
});

module.exports = router;

