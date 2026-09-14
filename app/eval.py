"""RAGAS evaluation. Run: python -m app.eval

The snake_case `from ragas.metrics import faithfulness, context_recall, ...`
API from the original build is ragas's legacy interface. This uses the
current collections-based API (SingleTurnSample / EvaluationDataset +
explicitly-instantiated metric classes), which is what recent ragas
releases document and recommend.

TODO: replace TEST_SET below with 5-10 real question/ground-truth pairs
drawn from YOUR documents. The three rows here are placeholders so the
script is runnable out of the box, not a real evaluation set.
"""
from langchain_huggingface import HuggingFaceEmbeddings
from langchain_openai import ChatOpenAI
from ragas import EvaluationDataset, SingleTurnSample, evaluate
from ragas.embeddings import LangchainEmbeddingsWrapper
from ragas.llms import LangchainLLMWrapper
from ragas.metrics import (Faithfulness, LLMContextPrecisionWithReference,
                            LLMContextRecall, ResponseRelevancy)

from app.chain import build_chain
from app.config import EMBEDDING_MODEL, LLM_MODEL

TEST_SET = [
    {
        "question": "What loader does the starter build use to ingest a folder of PDFs?",
        "ground_truth": "It uses LangChain's PyPDFDirectoryLoader, backed by pypdf, to load "
                         "every PDF in the data directory in one call.",
    },
    {
        "question": "Which vector database does the build use, and why?",
        "ground_truth": "It uses Chroma running as a persistent local, file-based store, "
                         "chosen because it needs no separate infrastructure and is easy "
                         "to swap out later.",
    },
    {
        "question": "What embedding model is used, and how many dimensions does it produce?",
        "ground_truth": "It uses the local sentence-transformers all-MiniLM-L6-v2 model, "
                         "which produces 384-dimensional embeddings.",
    },
]


def run():
    rag_chain = build_chain()  # same single-retrieval chain used by the API

    samples = []
    for item in TEST_SET:
        q = item["question"]
        result = rag_chain.invoke(q)
        samples.append(SingleTurnSample(
            user_input=q,
            response=result["answer"],
            retrieved_contexts=[d.page_content for d in result["docs"]],
            reference=item["ground_truth"],
        ))
    dataset = EvaluationDataset(samples=samples)

    judge_llm = LangchainLLMWrapper(ChatOpenAI(model=LLM_MODEL, temperature=0))
    judge_embeddings = LangchainEmbeddingsWrapper(HuggingFaceEmbeddings(model_name=EMBEDDING_MODEL))

    result = evaluate(
        dataset=dataset,
        metrics=[
            Faithfulness(llm=judge_llm),
            ResponseRelevancy(llm=judge_llm, embeddings=judge_embeddings),
            LLMContextPrecisionWithReference(llm=judge_llm),
            LLMContextRecall(llm=judge_llm),
        ],
    )
    print(result)
    result.to_pandas().to_csv("eval_results.csv", index=False)
    print("Saved eval_results.csv")


if __name__ == "__main__":
    run()
