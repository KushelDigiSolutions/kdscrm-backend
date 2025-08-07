import products from "../../models/pro.js"
import InstalledProducts from "../../models/installedpro.js";

// controllers/integrationAppController.js
export const createIntegrationApp = async (req, res) => {
    try {
        const app = await products.create(req.body);
        res.status(201).json({ status: true, data: app });
    } catch (err) {
        res.status(500).json({ status: false, message: err.message });
    }
};

// --- Create Operation ---
export const createProduct = async (req, res) => {
    try {
        const { name } = req.body;

        // Check if a product with the same name already exists
        const existingProduct = await products.findOne({ name: { $regex: new RegExp(name, 'i') } });
        if (existingProduct) {
            return res.status(409).json({ message: "A product with this name already exists." });
        }

        const newProduct = new products(req.body);
        const savedProduct = await newProduct.save();
        res.status(201).json(savedProduct);

    } catch (error) {
        res.status(500).json({ message: "Failed to create product", error: error.message });
    }
};

// --- Read Operations ---
export const getAllProducts = async (req, res) => {
    try {
        const allProducts = await products.find({ available: true });

        res.status(200).json({ allProducts, status: true });
    } catch (error) {
        res.status(500).json({ message: "Failed to fetch products", error: error.message, status: false });
    }
};

export const getProductById = async (req, res) => {
    try {
        const product = await products.findById(req.params.id);
        if (!product) {
            return res.status(404).json({ message: "Product not found" });
        }
        res.status(200).json(product);
    } catch (error) {
        res.status(500).json({ message: "Failed to fetch product", error: error.message });
    }
};

// --- Update Operation ---
export const updateProduct = async (req, res) => {
    try {
        const { id } = req.params;
        const { name } = req.body;

        // Check if the new name exists and belongs to a different product
        if (name) {
            const existingProduct = await products.findOne({ name: { $regex: new RegExp(`^${name}$`, 'i') }, _id: { $ne: id } });
            if (existingProduct) {
                return res.status(409).json({ message: "A product with this name already exists." });
            }
        }

        const updatedProduct = await products.findByIdAndUpdate(id, req.body, { new: true, runValidators: true });
        if (!updatedProduct) {
            return res.status(404).json({ message: "Product not found" });
        }
        res.status(200).json(updatedProduct);
    } catch (error) {
        res.status(500).json({ message: "Failed to update product", error: error.message });
    }
};


export const updateRequiredFields = async (req, res) => {
    try {
        const { id } = req.params;
        const { requiredFields } = req.body;

        if (!Array.isArray(requiredFields)) {
            return res.status(400).json({ message: "requiredFields must be an array." });
        }

        const updatedProduct = await products.findByIdAndUpdate(
            id,
            { requiredFields },
            { new: true, runValidators: true }
        );

        if (!updatedProduct) {
            return res.status(404).json({ message: "Product not found" });
        }

        res.status(200).json(updatedProduct);

    } catch (error) {
        res.status(500).json({ message: "Failed to update requiredFields", error: error.message });
    }
};

// --- Delete Operation ---
export const deleteProduct = async (req, res) => {
    try {
        const deletedProduct = await products.findByIdAndDelete(req.params.id);
        if (!deletedProduct) {
            return res.status(404).json({ message: "Product not found" });
        }
        res.status(200).json({ message: "Product successfully deleted" });
    } catch (error) {
        res.status(500).json({ message: "Failed to delete product", error: error.message });
    }
};


export const installApp = async (req, res) => {
    try {
        const { organizationId } = req.user; // coming from auth middleware
        const { name, image, requiredFields = [], config = {}, installedAt = new Date() } = req.body;

        const existing = await InstalledProducts.findOne({ organizationId, name });

        if (existing) {
            // If already installed, update
            existing.config = config;
            existing.installedAt = installedAt;
            existing.requiredFields = requiredFields;
            await existing.save();
            return res.status(200).json({ message: "App updated successfully", data: existing });
        }

        // Else install new
        const newApp = await InstalledProducts.create({
            name,
            image,
            requiredFields,
            config,
            organizationId,
            installedAt,
        });

        res.status(201).json({ message: "App installed successfully", data: newApp, status: true });
    } catch (error) {
        console.error("Install error:", error);
        res.status(500).json({ error: "Internal Server Error", status: false });
    }
};

export const updateAppFields = async (req, res) => {
    try {
        const { organizationId } = req.user;
        const { name } = req.params; // use app name in route
        const { config } = req.body;

        const app = await InstalledProducts.findOne({ organizationId, name });

        if (!app) {
            return res.status(404).json({ error: "App not found" });
        }

        app.config = { ...app.config, ...config }; // merge updates
        await app.save();

        res.status(200).json({ message: "App configuration updated", data: app });
    } catch (error) {
        console.error("Update error:", error);
        res.status(500).json({ error: "Internal Server Error" });
    }
};


export const uninstallApp = async (req, res) => {
    try {
        const { organizationId } = req.user;
        const { name } = req.params;

        const deleted = await InstalledProducts.findOneAndDelete({ organizationId, name });

        if (!deleted) {
            return res.status(404).json({ error: "App not found" });
        }

        res.status(200).json({ message: "App uninstalled successfully", status: true });
    } catch (error) {
        console.error("Uninstall error:", error);
        res.status(500).json({ error: "Internal Server Error", status: false });
    }
};


export const getInstalledApps = async (req, res) => {
    try {
        const { organizationId } = req.user;
        console.log(organizationId);
        const apps = await InstalledProducts.find({ organizationId });
        res.status(200).json({ apps, status: true });
    } catch (error) {
        res.status(500).json({ error: "Failed to fetch installed apps", status: false });
    }
};
