const router = require("express").Router();

const { answerController } = require("../controllers");

router.post("/ans", answerController.addAnswer);
router.put("/edit", answerController.editAnswer);
router.delete("/remove", answerController.removeAnswer);
router.get("/all", answerController.AllAnswer);
router.post("/accept", answerController.markAnswerAccepted);

router.get("/:id", answerController.getAnswer);

module.exports = router;
