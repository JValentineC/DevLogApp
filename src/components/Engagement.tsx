import React, { useState, useEffect } from "react";
import {
  peopleApi,
  cycleApi,
  type Person,
  type Cycle,
  ApiError,
} from "../lib/api";
import "./Engagement.css";

const Engagement: React.FC = () => {
  const [people, setPeople] = useState<Person[]>([]);
  const [cycles, setCycles] = useState<Cycle[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Filters
  const [selectedCycle, setSelectedCycle] = useState<string>("");
  const [captainFilter, setCaptainFilter] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<string>("");
  const [searchQuery, setSearchQuery] = useState("");

  // Pagination
  const [totalCount, setTotalCount] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 50;

  // Fetch cycles on mount
  useEffect(() => {
    fetchCycles();
  }, []);

  // Fetch people when filters change
  useEffect(() => {
    fetchPeople();
  }, [selectedCycle, captainFilter, statusFilter, searchQuery, currentPage]);

  const fetchCycles = async () => {
    try {
      const { cycles: fetchedCycles } = await cycleApi.getAll();
      setCycles(fetchedCycles);
    } catch (err) {
      console.error("Error fetching cycles:", err);
    }
  };

  const fetchPeople = async () => {
    try {
      setLoading(true);
      const filters: any = {
        limit: pageSize,
        offset: (currentPage - 1) * pageSize,
      };

      if (selectedCycle) {
        filters.cycleId = parseInt(selectedCycle);
      }
      if (captainFilter === "captains") {
        filters.isCaptain = true;
      } else if (captainFilter === "non-captains") {
        filters.isCaptain = false;
      }
      if (statusFilter) {
        filters.status = statusFilter;
      }
      if (searchQuery) {
        filters.search = searchQuery;
      }

      const { people: fetchedPeople, count } = await peopleApi.getAll(filters);
      setPeople(fetchedPeople);
      setTotalCount(count);
      setError("");
    } catch (err) {
      console.error("Error fetching people:", err);
      setError(
        err instanceof ApiError
          ? err.message
          : "Failed to load alumni data. Please try again later."
      );
    } finally {
      setLoading(false);
    }
  };

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value);
    setCurrentPage(1); // Reset to first page on search
  };

  const handleCycleChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setSelectedCycle(e.target.value);
    setCurrentPage(1);
  };

  const handleCaptainFilterChange = (
    e: React.ChangeEvent<HTMLSelectElement>
  ) => {
    setCaptainFilter(e.target.value);
    setCurrentPage(1);
  };

  const handleStatusFilterChange = (
    e: React.ChangeEvent<HTMLSelectElement>
  ) => {
    setStatusFilter(e.target.value);
    setCurrentPage(1);
  };

  const clearFilters = () => {
    setSelectedCycle("");
    setCaptainFilter("all");
    setStatusFilter("");
    setSearchQuery("");
    setCurrentPage(1);
  };

  const totalPages = Math.ceil(totalCount / pageSize);

  const getStatusBadge = (status: string) => {
    const statusClasses: Record<string, string> = {
      unclaimed: "status-unclaimed",
      invited: "status-invited",
      signed_up: "status-active",
      deactivated: "status-inactive",
    };
    return statusClasses[status] || "";
  };

  if (loading && people.length === 0) {
    return <div className="engagement__loading">Loading alumni data...</div>;
  }

  return (
    <div className="engagement">
      <div className="engagement__header">
        <h2>Alumni Engagement</h2>
        <span className="engagement__count">
          {totalCount} {totalCount === 1 ? "person" : "people"}
        </span>
      </div>

      {/* Filters */}
      <div className="engagement__filters">
        <div className="engagement__filter-group">
          <label htmlFor="search">Search</label>
          <input
            id="search"
            type="text"
            placeholder="Search by name or email..."
            value={searchQuery}
            onChange={handleSearchChange}
            className="engagement__search"
          />
        </div>

        <div className="engagement__filter-group">
          <label htmlFor="cycle">Cycle</label>
          <select
            id="cycle"
            value={selectedCycle}
            onChange={handleCycleChange}
            className="engagement__select"
          >
            <option value="">All Cycles</option>
            {cycles.map((cycle) => (
              <option key={cycle.id} value={cycle.id}>
                Cycle {cycle.cycleNumber} ({cycle.memberCount} members)
              </option>
            ))}
          </select>
        </div>

        <div className="engagement__filter-group">
          <label htmlFor="captain">Captain Status</label>
          <select
            id="captain"
            value={captainFilter}
            onChange={handleCaptainFilterChange}
            className="engagement__select"
          >
            <option value="all">All</option>
            <option value="captains">Captains Only</option>
            <option value="non-captains">Non-Captains</option>
          </select>
        </div>

        <div className="engagement__filter-group">
          <label htmlFor="status">Account Status</label>
          <select
            id="status"
            value={statusFilter}
            onChange={handleStatusFilterChange}
            className="engagement__select"
          >
            <option value="">All Statuses</option>
            <option value="unclaimed">Unclaimed</option>
            <option value="invited">Invited</option>
            <option value="signed_up">Signed Up</option>
            <option value="deactivated">Deactivated</option>
          </select>
        </div>

        <button onClick={clearFilters} className="engagement__clear-btn">
          Clear Filters
        </button>
      </div>

      {error && <div className="engagement__error">{error}</div>}

      {/* Results Table */}
      <div className="engagement__table-wrapper">
        <table className="engagement__table">
          <thead>
            <tr>
              <th>Name</th>
              <th>Cycles</th>
              <th>Captain</th>
              <th>Org Email</th>
              <th>Personal Email</th>
              <th>Phone</th>
              <th>Status</th>
              <th>iCAA</th>
            </tr>
          </thead>
          <tbody>
            {people.length === 0 ? (
              <tr>
                <td colSpan={8} className="engagement__no-results">
                  No alumni found matching your filters
                </td>
              </tr>
            ) : (
              people.map((person) => (
                <tr key={person.id}>
                  <td className="engagement__name">
                    <div className="person-name">
                      <span className="person-name-full">{person.fullName}</span>
                      <span className="person-name-mobile">{person.firstName}</span>
                    </div>
                    {person.linkedInUrl && (
                      <a
                        href={person.linkedInUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="person-linkedin"
                      >
                        LinkedIn
                      </a>
                    )}
                  </td>
                  <td>{person.cycles || "-"}</td>
                  <td>
                    {person.isCaptain ? (
                      <span className="captain-badge">⭐ Captain</span>
                    ) : (
                      "-"
                    )}
                  </td>
                  <td className="engagement__email">
                    {person.orgEmail || "-"}
                  </td>
                  <td className="engagement__email">
                    {person.personalEmail || "-"}
                  </td>
                  <td>{person.phone || "-"}</td>
                  <td>
                    <span
                      className={`status-badge ${getStatusBadge(
                        person.accountStatus
                      )}`}
                    >
                      {person.accountStatus}
                    </span>
                  </td>
                  <td>
                    {person.isICaaMember ? (
                      <span className="icaa-badge">
                        ✓ {person.icaaTier || "Member"}
                      </span>
                    ) : (
                      "-"
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="engagement__pagination">
          <button
            onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
            disabled={currentPage === 1}
            className="engagement__page-btn"
          >
            Previous
          </button>
          <span className="engagement__page-info">
            Page {currentPage} of {totalPages}
          </span>
          <button
            onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
            disabled={currentPage === totalPages}
            className="engagement__page-btn"
          >
            Next
          </button>
        </div>
      )}
    </div>
  );
};

export default Engagement;
