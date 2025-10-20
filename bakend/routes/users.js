const express = require("express");
const router = express.Router();
const {
  verifyTokenMiddleware,
  isAdmin,
  authorizeOwnerOrAdmin,
} = require("../middleware/auth");
const {
  adduser,
  addsector,
  getallusers,
  getuserbyid,
  stats,
  updatestatus,
  getallsectors,
  deleteuser,
  updateuser,
  deletesector,
  updatesector,
  filterBySector,
  search,
  sort,
} = require("../controller/users");
router.post("/add-user", verifyTokenMiddleware, isAdmin, adduser);
router.post("/add-sector", verifyTokenMiddleware, isAdmin, addsector);
router.get("/all-users", verifyTokenMiddleware, isAdmin, getallusers);
router.get(
  "/user/:id",
  verifyTokenMiddleware,
  authorizeOwnerOrAdmin,
  getuserbyid
);
router.get("/stats", verifyTokenMiddleware, isAdmin, stats);
router.put("/update-status/:id", verifyTokenMiddleware, isAdmin, updatestatus);
router.get("/all-sectors", verifyTokenMiddleware, isAdmin, getallsectors);
router.delete("/delete-user/:id", verifyTokenMiddleware, isAdmin, deleteuser);
router.put("/update-user/:id", verifyTokenMiddleware, isAdmin, updateuser);
router.delete(
  "/delete-sector/:id",
  verifyTokenMiddleware,
  isAdmin,
  deletesector
);
router.put("/update-sector/:id", verifyTokenMiddleware, isAdmin, updatesector);
router.get("/filter-by-sector", verifyTokenMiddleware, filterBySector);
router.get("/search", verifyTokenMiddleware, search);
router.get("/sort", verifyTokenMiddleware, sort);
module.exports = router;
