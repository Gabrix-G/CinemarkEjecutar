const multer = require('multer');
const path = require('path');

// Configuración de almacenamiento
const storage = multer.diskStorage({
  destination: function(req, file, cb) {
    cb(null, 'uploads/');
  },
  filename: function(req, file, cb) {
    cb(
      null,
      `${file.fieldname}-${Date.now()}${path.extname(file.originalname)}`
    );
  }
});
// Filtro para archivos
const fileFilter = (req, file, cb) => {
  // Tipos de archivo permitidos
  const filetypes = /jpeg|jpg|png/;
  // Verificar extensión
  const extname = filetypes.test(path.extname(file.originalname).toLowerCase());
  // Verificar mimetype
  const mimetype = filetypes.test(file.mimetype);

  if (mimetype && extname) {
    return cb(null, true);
  } else {
    cb(new Error('Error: Solo se permiten imágenes (jpeg, jpg, png)'));
  }
};

// Exportar configuración
exports.upload = multer({
  storage: storage,
  limits: {
    fileSize: 1024 * 1024 * 5 // 5 MB maxximo
  },
  fileFilter: fileFilter
});

module.exports = upload;