from unittest.mock import Mock

import pytest

from scoreboard.domain.orchestrators.contracts import ActionPayload, FrameCalculationContext


def test_require_score_result_reports_missing_pipeline_dependency() -> None:
    context = FrameCalculationContext(
        frame=Mock(),
        payload=ActionPayload(potted_balls=()),
    )

    with pytest.raises(RuntimeError, match="BreakProcessor requires ScoreProcessor to run first"):
        context.require_score_result("BreakProcessor")
