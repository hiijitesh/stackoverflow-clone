const { default: mongoose } = require("mongoose");
const {
	errorResponse,
	invalidFieldResponse,
	successResponse,
	forbiddenResponse,
} = require("../../utils/errorHandler");
const {
	getQuestionById,
	updateQuestion,
} = require("../questions/questionService");
const {
	answerToQuestion,
	getAnswerById,
	updateAnswer,
	deleteAnswer,
	getTotalAnswer,
} = require("./answerService");

const controllers = {
	addAnswer: async (req, res) => {
		try {
			const { questionId, description } = req.body;
			const userId = req.userInfo.id;

			if (!description) {
				return invalidFieldResponse(res, "please provide answer description!");
			}
			if (!questionId) {
				return invalidFieldResponse(res, "please provide questionId!");
			}

			// user cant ans to own question
			const question = await getQuestionById(
				new mongoose.Types.ObjectId(questionId)
			);
			if (question.askedBy === userId) {
				return errorResponse(res, "You can't answer your own question!");
			}

			const ansData = {
				description,
				questionId,
				answeredBy: userId,
			};
			const answer = await answerToQuestion(ansData);
			if (!answer) {
				return errorResponse(res, {}, "couldn't add answer, try again!");
			}

			return successResponse(res, answer, "You answer posted");
		} catch (error) {
			console.error(error.message);
		}
	},

	getAnswer: async (req, res) => {
		try {
			const { ansId } = req.params;
			const answer = await getAnswerById(ansId);
			if (!answer) {
				return errorResponse(res, {}, "answer doesn't exits");
			}

			return successResponse(res, answer, "answer found");
		} catch (error) {
			console.error(error.message);
		}
	},

	allAnswer: async (req, res) => {
		try {
			const { questionId } = req.body;

			if (!questionId) {
				return invalidFieldResponse(res, "no question Id found");
			}

			const filter = {};
			filter.questionId = new mongoose.Types.ObjectId(questionId);
			filter.isAccepted = false;

			const totalAnswer = await getTotalAnswer(filter);
			if (!totalAnswer) {
				return errorResponse(res, "answer doesn't exits");
			}

			return successResponse(res, totalAnswer, "ans found");
		} catch (error) {
			console.error(error.message);
		}
	},

	editAnswer: async (req, res) => {
		try {
			const { ansId, description } = req.body;
			const userId = req.userInfo.id;

			if (!ansId) {
				return invalidFieldResponse(res, "please provide answerId");
			}
			if (!description) {
				return invalidFieldResponse(res, "please provide answer description");
			}

			const answer = await getAnswerById(ansId);
			if (answer.answeredBy.toString() !== userId.toString()) {
				return forbiddenResponse(
					res,
					"you are not authorized to edit this answer"
				);
			}

			const updateData = {
				description,
			};
			const ans = await updateAnswer(
				{ _id: new mongoose.Types.ObjectId(ansId) },
				updateData
			);
			if (!updateAnswer) {
				return errorResponse(res, "couldn't update answer");
			}

			return successResponse(res, ans, "answer updated successfully");
		} catch (error) {
			console.error(error.message);
		}
	},

	removeAnswer: async (req, res) => {
		try {
			const { ansId } = req.body;
			const userId = req.userInfo.id;

			if (!ansId) {
				return invalidFieldResponse(res, "please provide answerId");
			}

			const answer = await getAnswerById(ansId);
			if (answer.answeredBy.toString() !== userId.toString()) {
				return forbiddenResponse(
					res,
					"you are not authorized to delete this answer"
				);
			}
			const deletedAnsData = await deleteAnswer(ansId);
			if (!deletedAnsData) {
				return errorResponse(res, {}, "couldn't delete answer");
			}

			return successResponse(
				res,
				deletedAnsData,
				"Answer deleted successfully"
			);
		} catch (error) {
			console.error(error.message);
		}
	},

	markAnswerAccepted: async (req, res) => {
		try {
			const { ansId } = req.body;
			const userId = req.userInfo.id;

			const answer = await getAnswerById(ansId);
			if (!answer) {
				return errorResponse(res, "No such Answer exists!");
			}

			if (answer.isAccepted) {
				return errorResponse(res, answer, "Answer is already accepted");
			}

			const question = await getQuestionById(answer.questionId);
			if (userId.toString() !== question.askedBy.toString()) {
				return forbiddenResponse(
					res,
					"your are not authorized to mark this ans accepted"
				);
			}

			const markAccepted = await updateAnswer(ansId, { isAccepted: true });
			if (!markAccepted) {
				return errorResponse(res, answer, "couldn't mark accepted");
			}

			const markQuestionAsAnswered = await updateQuestion(question._id, {
				isAnswered: true,
			});

			if (!markQuestionAsAnswered) {
				return errorResponse(
					res,
					question,
					"couldn't mark question as answered"
				);
			}
			return successResponse(res, markAccepted, "answer accepted!");
		} catch (error) {
			console.error(error.message);
		}
	},
};

module.exports = controllers;