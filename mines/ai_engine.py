def generate_risk_explanation(
    risk_result,
    ml_result
):

    factors = risk_result.get("factors", [])

    score = ml_result.get("score", 0)

    level = ml_result.get("level", "LOW")

    explanations = []

    recommendations = []


    # --------------------------------
    # EXPLANATIONS
    # --------------------------------

    for factor in factors:

        explanations.append(factor)


    if not explanations:

        explanations.append(
            "No significant risk factors were detected."
        )


    # --------------------------------
    # RECOMMENDATIONS
    # --------------------------------

    for factor in factors:

        factor_lower = factor.lower()

        if "critical" in factor_lower:

            recommendations.append(
                "Resolve critical-severity violations immediately."
            )

        elif "high" in factor_lower:

            recommendations.append(
                "Prioritize resolution of high-severity violations."
            )

        elif "overdue compliance" in factor_lower:

            recommendations.append(
                "Complete overdue compliance requirements."
            )

        elif "overdue inspection" in factor_lower:

            recommendations.append(
                "Schedule and complete the overdue inspection."
            )

        elif "expired contractor" in factor_lower:

            recommendations.append(
                "Renew expired contractor compliance documents."
            )


    # --------------------------------
    # RISK LEVEL RECOMMENDATION
    # --------------------------------

    if level == "CRITICAL":

        recommendations.append(
            "Conduct immediate management review of this mine."
        )

    elif level == "HIGH":

        recommendations.append(
            "Schedule a priority inspection and corrective-action review."
        )

    elif level == "MEDIUM":

        recommendations.append(
            "Increase monitoring until outstanding issues are resolved."
        )

    else:

        recommendations.append(
            "Continue routine monitoring and compliance checks."
        )


    # --------------------------------
    # REMOVE DUPLICATES
    # --------------------------------

    recommendations = list(
        dict.fromkeys(recommendations)
    )


    return {
        "score": score,
        "level": level,
        "explanations": explanations,
        "recommendations": recommendations,
    }