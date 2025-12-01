import os
import sys
import json
from datasets import Dataset
from openai import OpenAI
from ragas import evaluate
from ragas.llms import llm_factory
from ragas.metrics import (
    faithfulness,
    answer_correctness,
    context_precision,
    context_recall,
)


def main():
    raw = sys.stdin.read()
    data = json.loads(raw)
    ds = Dataset.from_list(data)

    github_token = os.environ.get("GITHUB_MODELS_TOKEN")
    if not github_token:
        raise RuntimeError("GITHUB_MODELS_TOKEN is not set")

    # make sure default OpenAI clients see a key
    os.environ.setdefault("OPENAI_API_KEY", github_token)

    base_url = "https://models.github.ai/inference"

    # LLM client pointing to GitHub Models
    client = OpenAI(
        api_key=github_token,
        base_url=base_url,
    )

    # wrap for Ragas
    ragas_llm = llm_factory(
        client=client,
        model="openai/gpt-4o-mini",
    )

    # let Ragas build its own embeddings (it will use OPENAI_API_KEY)
    result = evaluate(
        ds,
        metrics=[faithfulness, answer_correctness, context_precision, context_recall],
        llm=ragas_llm,
    )

    overall = result["score"]
    per_sample = result["results"]

    rows = []
    for row in per_sample:
        rows.append(
            {
                "question": row["question"],
                "answer_correctness": float(row["answer_correctness"]),
                "faithfulness": float(row["faithfulness"]),
                "context_precision": float(row["context_precision"]),
                "context_recall": float(row["context_recall"]),
                "latency_ms": float(row.get("latency_ms", 0.0)),
            }
        )

    payload = {"overall": overall, "rows": rows}
    print(json.dumps(payload))


if __name__ == "__main__":
    main()
