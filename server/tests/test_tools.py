"""Tests for agent tools."""

import pytest
from unittest.mock import patch, MagicMock

from langchain_core.documents import Document


class TestSearchCompanyKnowledgeTool:
    """Tests for the search_company_knowledge ADK tool."""

    @patch("app.agent.tools._rag_search")
    def test_tool_returns_formatted_string(self, mock_search):
        """Test that the tool returns a formatted string."""
        from app.agent.tools import search_company_knowledge

        mock_search.return_value = [
            {
                "rank": 1,
                "source": "https://example.com/services",
                "title": "Services",
                "content": "We provide consulting.",
                "score": 0.9,
            },
        ]

        result = search_company_knowledge("what services")
        assert isinstance(result, str)
        assert "consulting" in result

    @patch("app.agent.tools._rag_search")
    def test_tool_handles_no_results(self, mock_search):
        """Test tool behavior when no results found."""
        from app.agent.tools import search_company_knowledge

        mock_search.return_value = []

        result = search_company_knowledge("unrelated query")
        assert "No relevant" in result

    @patch("app.agent.tools._rag_search")
    def test_tool_handles_exception(self, mock_search):
        """Test tool handles exceptions gracefully."""
        from app.agent.tools import search_company_knowledge

        mock_search.side_effect = Exception("Connection error")

        result = search_company_knowledge("test query")
        assert "unable" in result.lower() or "specialist" in result.lower()


class TestTransferToHumanTool:
    """Tests for the transfer_to_human ADK tool."""

    def test_transfer_returns_confirmation(self):
        """Test that transfer returns a confirmation message."""
        from app.agent.tools import transfer_to_human

        result = transfer_to_human(
            reason="Customer interested in SAP BTP",
            customer_requirement="SAP BTP implementation for retail",
        )

        assert isinstance(result, str)
        assert "Transfer request submitted" in result
        assert "SAP BTP implementation" in result

    def test_transfer_includes_timestamp(self):
        """Test that transfer includes a timestamp."""
        from app.agent.tools import transfer_to_human

        result = transfer_to_human(
            reason="Customer wants pricing",
            customer_requirement="Pricing for cloud migration",
        )

        # Should contain ISO timestamp
        assert "T" in result  # ISO format contains T

    def test_transfer_with_empty_strings(self):
        """Test transfer with minimal input."""
        from app.agent.tools import transfer_to_human

        result = transfer_to_human(reason="", customer_requirement="")
        assert isinstance(result, str)
        assert "Transfer request submitted" in result

    def test_transfer_with_special_characters(self):
        """Test transfer with special characters in input."""
        from app.agent.tools import transfer_to_human

        result = transfer_to_human(
            reason="Customer asked about 'SAP S/4HANA' & \"cloud\" services",
            customer_requirement="Need S/4HANA + BTP integration",
        )

        assert isinstance(result, str)
        assert "Transfer request submitted" in result


class TestWebSearchTool:
    """Tests for the web_search tool using Tavily."""

    @patch("tavily.TavilyClient")
    def test_web_search_success_with_answer_and_sources(self, mock_client_cls):
        """Test web_search returns formatted answer and sources."""
        from app.agent.tools import web_search

        mock_instance = MagicMock()
        mock_client_cls.return_value = mock_instance
        mock_instance.search.return_value = {
            "answer": "Fare from Rajiv Chowk to Kashmere Gate is 20 rupees. Distance is 4 km and travel time is 6 minutes.",
            "results": [
                {
                    "title": "Rajiv Chowk to Kashmere Gate Metro Route",
                    "url": "https://delhimetrorail.info/route",
                    "content": "Yellow line direct train with 5 stops.",
                }
            ],
        }

        with patch.dict("os.environ", {"TAVILY_API_KEY": "test-key"}):
            with patch("app.config.TAVILY_API_KEY", "test-key"):
                res = web_search("fare and stops from Rajiv Chowk to Kashmere Gate")

        assert "20 rupees" in res
        assert "4 km" in res
        assert "Yellow line" in res
        assert "Rajiv Chowk to Kashmere Gate Metro Route" in res
        mock_instance.search.assert_called_once()
        call_query = mock_instance.search.call_args[1]["query"]
        assert "Delhi Metro" in call_query

    def test_web_search_empty_query(self):
        """Test web_search handles empty or whitespace query."""
        from app.agent.tools import web_search

        res = web_search("   ")
        assert "valid query" in res.lower()

    def test_web_search_missing_api_key(self):
        """Test web_search handles missing Tavily API key gracefully."""
        from app.agent.tools import web_search

        with patch.dict("os.environ", {"TAVILY_API_KEY": ""}):
            with patch("app.config.TAVILY_API_KEY", ""):
                res = web_search("Delhi Metro fare from Rajiv Chowk to Kashmere Gate")
                assert "unavailable" in res.lower() or "not configured" in res.lower()

    @patch("tavily.TavilyClient")
    def test_web_search_handles_exception(self, mock_client_cls):
        """Test web_search handles API exceptions gracefully."""
        from app.agent.tools import web_search

        mock_instance = MagicMock()
        mock_client_cls.return_value = mock_instance
        mock_instance.search.side_effect = Exception("Tavily service timeout")

        with patch.dict("os.environ", {"TAVILY_API_KEY": "test-key"}):
            with patch("app.config.TAVILY_API_KEY", "test-key"):
                res = web_search("fare from Rajiv Chowk to Kashmere Gate")

        assert "unable to search" in res.lower() or "error" in res.lower()

