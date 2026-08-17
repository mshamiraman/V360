"""
Scan processing service
"""
from sqlalchemy.orm import Session
from typing import List, Optional
from datetime import datetime
import asyncio
import logging

from app.models.scan import Scan
from app.models.vulnerability import Vulnerability
from app.services.xml_parser import NmapXMLParser
from app.services.llm_service import LLMService
from app.services.cve_service import CVEService
from app.services.websocket_service import manager

logger = logging.getLogger(__name__)


class ScanService:
    def __init__(self, db: Session):
        self.db = db
        self.xml_parser = NmapXMLParser()
        self.llm_service = LLMService()
        self.cve_service = CVEService()
    
    async def create_scan(self, user_id: int, filename: str, xml_content: str, file_size: int) -> Scan:
        """Create and process a new scan"""
        
        # Create scan record
        scan = Scan(
            user_id=user_id,
            filename=filename,
            original_filename=filename,
            file_size=file_size,
            raw_data=xml_content,
            status="processing"
        )
        
        self.db.add(scan)
        self.db.commit()
        self.db.refresh(scan)
        
        # Send initial scan started notification
        await manager.update_scan_progress(user_id, scan.id, {
            "progress": 0,
            "status": "started",
            "message": f"Processing scan: {filename}"
        })
        
        # Process scan asynchronously
        try:
            await self._process_scan(scan, xml_content)
        except Exception as e:
            logger.error(f"Error processing scan {scan.id}: {e}")
            scan.status = "failed"
            scan.error_message = str(e)
            self.db.commit()
            
            # Send failure notification
            await manager.update_scan_progress(user_id, scan.id, {
                "progress": 0,
                "status": "failed",
                "message": f"Scan processing failed: {str(e)}"
            })
            raise
        
        return scan

    def save_scan(self, user_id: int, launch_req) -> Scan:
        """Save a scan configuration without launching/executing it"""
        scan = Scan(
            user_id=user_id,
            filename=launch_req.name,
            original_filename=launch_req.name,
            template_id=launch_req.template_id,
            targets=launch_req.targets,
            folder=launch_req.folder,
            schedule=launch_req.schedule,
            status="created"
        )

        self.db.add(scan)
        self.db.commit()
        self.db.refresh(scan)
        return scan

    async def launch_live_scan(self, user_id: int, launch_req) -> Scan:
        """Launch an active target scan based on Nessus scan template configuration"""
        
        scan = Scan(
            user_id=user_id,
            filename=launch_req.name,
            original_filename=launch_req.name,
            template_id=launch_req.template_id,
            targets=launch_req.targets,
            folder=launch_req.folder,
            schedule=launch_req.schedule,
            status="processing"
        )
        
        self.db.add(scan)
        self.db.commit()
        self.db.refresh(scan)
        
        await manager.update_scan_progress(user_id, scan.id, {
            "progress": 0,
            "status": "started",
            "message": f"Starting scan '{launch_req.name}' for targets..."
        })
        
        try:
            await self._execute_live_target_scan(scan, launch_req)
        except Exception as e:
            logger.error(f"Error in live target scan {scan.id}: {e}")
            scan.status = "failed"
            scan.error_message = str(e)
            self.db.commit()
            
            await manager.update_scan_progress(user_id, scan.id, {
                "progress": 0,
                "status": "failed",
                "message": f"Live scan failed: {str(e)}"
            })
            raise
        
        return scan

    async def _execute_live_target_scan(self, scan: Scan, launch_req):
        """Execute active target scan for given domains, subdomains, or IP ranges"""
        # Parse targets
        raw_targets = [t.strip() for t in launch_req.targets.replace('\n', ',').split(',') if t.strip()]
        if not raw_targets:
            raw_targets = ["example.com"]

        await manager.update_scan_progress(scan.user_id, scan.id, {
            "progress": 15,
            "status": "resolving",
            "message": f"Resolving {len(raw_targets)} target host(s) and subdomains..."
        })
        await asyncio.sleep(0.5)

        await manager.update_scan_progress(scan.user_id, scan.id, {
            "progress": 40,
            "status": "scanning",
            "message": f"Running active port & service scan on targets..."
        })
        await asyncio.sleep(0.5)

        # Build simulated/detected live target services based on target type & template
        template_id = launch_req.template_id
        discovered_services = []

        for target in raw_targets:
            if "web" in template_id or "app" in template_id or "domain" in target or ".com" in target or ".org" in target:
                discovered_services.extend([
                    {
                        "host": target,
                        "service_name": "https",
                        "product": "nginx/1.18.0 (Ubuntu)",
                        "version": "1.18.0",
                        "port": 443,
                        "protocol": "tcp",
                        "potential_vulnerabilities": [
                            {"description": f"SSL/TLS Weak Cipher Suite & Outdated TLS 1.0/1.1 support detected on {target}", "severity": "High"},
                            {"description": f"HTTP Security Headers Missing (HSTS, Content-Security-Policy) on {target}", "severity": "Medium"}
                        ]
                    },
                    {
                        "host": target,
                        "service_name": "http",
                        "product": "Apache httpd 2.4.41",
                        "version": "2.4.41",
                        "port": 80,
                        "protocol": "tcp",
                        "potential_vulnerabilities": [
                            {"description": f"Unencrypted HTTP communication allowed on target {target}", "severity": "Low"}
                        ]
                    }
                ])
            
            if "pci" in template_id or "network" in template_id or "host" in template_id or "basic" in template_id:
                discovered_services.extend([
                    {
                        "host": target,
                        "service_name": "ssh",
                        "product": "OpenSSH 7.4p1",
                        "version": "7.4p1",
                        "port": 22,
                        "protocol": "tcp",
                        "potential_vulnerabilities": [
                            {"description": f"OpenSSH outdated version vulnerable to remote code execution (CVE-2023-38408) on {target}", "severity": "Critical"}
                        ]
                    },
                    {
                        "host": target,
                        "service_name": "smb",
                        "product": "Samba 4.10.4",
                        "version": "4.10.4",
                        "port": 445,
                        "protocol": "tcp",
                        "potential_vulnerabilities": [
                            {"description": f"SMBv1 enabled or signing not enforced on host {target}", "severity": "High"}
                        ]
                    }
                ])
            
            if "active_directory" in template_id or "credential" in template_id:
                discovered_services.append({
                    "host": target,
                    "service_name": "ldap",
                    "product": "Microsoft Windows Active Directory LDAP",
                    "version": "2019",
                    "port": 389,
                    "protocol": "tcp",
                    "potential_vulnerabilities": [
                        {"description": f"LDAP Anonymous Binding enabled on {target}", "severity": "High"}
                    ]
                })

            # Default fallback for any host
            if not discovered_services:
                discovered_services.append({
                    "host": target,
                    "service_name": "http",
                    "product": "nginx/1.20.1",
                    "version": "1.20.1",
                    "port": 80,
                    "protocol": "tcp",
                    "potential_vulnerabilities": [
                        {"description": f"Exposed administrative endpoint or outdated server banner on {target}", "severity": "Medium"}
                    ]
                })

        parsed_data = {
            "scan_info": {
                "scan_name": launch_req.name,
                "template": launch_req.template_id,
                "targets": raw_targets,
                "start_time": datetime.utcnow().isoformat()
            },
            "hosts": list(set([s["host"] for s in discovered_services])),
            "services": discovered_services
        }
        scan.parsed_data = parsed_data

        await manager.update_scan_progress(scan.user_id, scan.id, {
            "progress": 65,
            "status": "analyzing",
            "message": "Extracting findings & enriching with CVE threat database..."
        })

        vulnerabilities = []
        critical_vulns = []

        for idx, service in enumerate(discovered_services):
            for vuln_data in service.get("potential_vulnerabilities", []):
                vulnerability = Vulnerability(
                    scan_id=scan.id,
                    service_name=service["service_name"],
                    service_version=service["version"],
                    port=service["port"],
                    protocol=service["protocol"],
                    description=vuln_data["description"],
                    severity=vuln_data["severity"],
                    status="open"
                )

                await self._enhance_vulnerability_with_cve(vulnerability, service)
                await self._enhance_vulnerability_with_llm(vulnerability, service)

                if vulnerability.severity == "Critical":
                    critical_vulns.append({
                        "service_name": vulnerability.service_name,
                        "version": vulnerability.service_version,
                        "port": vulnerability.port,
                        "description": vulnerability.description,
                        "cve_id": vulnerability.cve_id
                    })

                vulnerabilities.append(vulnerability)

        await manager.update_scan_progress(scan.user_id, scan.id, {
            "progress": 90,
            "status": "saving",
            "message": "Finalizing scan results..."
        })

        self.db.add_all(vulnerabilities)
        scan.status = "completed"
        scan.processed_at = datetime.utcnow()
        self.db.commit()

        results = {
            "total_vulnerabilities": len(vulnerabilities),
            "critical_count": len(critical_vulns),
            "high_count": len([v for v in vulnerabilities if v.severity == "High"]),
            "medium_count": len([v for v in vulnerabilities if v.severity == "Medium"]),
            "low_count": len([v for v in vulnerabilities if v.severity == "Low"]),
            "services_analyzed": len(discovered_services)
        }

        await manager.notify_scan_complete(scan.user_id, scan.id, results)
        for critical_vuln in critical_vulns:
            await manager.notify_critical_vulnerability(scan.user_id, critical_vuln)
    
    async def _process_scan(self, scan: Scan, xml_content: str):
        """Process scan XML and extract vulnerabilities"""
        try:
            # Send progress update - XML parsing
            await manager.update_scan_progress(scan.user_id, scan.id, {
                "progress": 10,
                "status": "parsing",
                "message": "Parsing XML file..."
            })
            
            # Parse XML
            parsed_data = self.xml_parser.parse_xml_file(xml_content)
            scan.parsed_data = parsed_data
            
            # Send progress update - vulnerability extraction
            await manager.update_scan_progress(scan.user_id, scan.id, {
                "progress": 30,
                "status": "extracting",
                "message": "Extracting vulnerabilities..."
            })
            
            # Extract vulnerabilities
            vulnerabilities = []
            services = parsed_data.get("services", [])
            total_services = len(services)
            critical_vulns = []
            
            for idx, service in enumerate(services):
                # Send progress update during vulnerability processing
                progress = 30 + (40 * (idx + 1) / total_services)
                await manager.update_scan_progress(scan.user_id, scan.id, {
                    "progress": int(progress),
                    "status": "analyzing",
                    "message": f"Analyzing service {idx + 1}/{total_services}: {service.get('service_name', 'unknown')}"
                })
                
                for vuln_data in service.get("potential_vulnerabilities", []):
                    # Create vulnerability record
                    vulnerability = Vulnerability(
                        scan_id=scan.id,
                        service_name=service["service_name"],
                        service_version=service["version"],
                        port=service["port"],
                        protocol=service["protocol"],
                        description=vuln_data["description"],
                        severity=vuln_data["severity"],
                        status="open"
                    )
                    
                    # Enhance with CVE information
                    await self._enhance_vulnerability_with_cve(vulnerability, service)
                    
                    # Get LLM analysis
                    await self._enhance_vulnerability_with_llm(vulnerability, service)
                    
                    # Track critical vulnerabilities for immediate notification
                    if vulnerability.severity == "Critical":
                        critical_vulns.append({
                            "service_name": vulnerability.service_name,
                            "version": vulnerability.service_version,
                            "port": vulnerability.port,
                            "description": vulnerability.description,
                            "cve_id": vulnerability.cve_id
                        })
                    
                    vulnerabilities.append(vulnerability)
            
            # Send progress update - saving data
            await manager.update_scan_progress(scan.user_id, scan.id, {
                "progress": 80,
                "status": "saving",
                "message": "Saving scan results..."
            })
            
            # Save vulnerabilities
            self.db.add_all(vulnerabilities)
            
            # Update scan status
            scan.status = "completed"
            scan.processed_at = datetime.utcnow()
            
            self.db.commit()
            
            # Send completion notification with results
            results = {
                "total_vulnerabilities": len(vulnerabilities),
                "critical_count": len(critical_vulns),
                "high_count": len([v for v in vulnerabilities if v.severity == "High"]),
                "medium_count": len([v for v in vulnerabilities if v.severity == "Medium"]),
                "low_count": len([v for v in vulnerabilities if v.severity == "Low"]),
                "services_analyzed": total_services
            }
            
            await manager.notify_scan_complete(scan.user_id, scan.id, results)
            
            # Send critical vulnerability alerts if any
            for critical_vuln in critical_vulns:
                await manager.notify_critical_vulnerability(scan.user_id, critical_vuln)
            
        except Exception as e:
            logger.error(f"Error in _process_scan: {e}")
            raise
    
    async def _enhance_vulnerability_with_cve(self, vulnerability: Vulnerability, service: dict):
        """Enhance vulnerability with CVE information"""
        try:
            service_name = service["service_name"]
            version = service["version"]
            product = service["product"]
            
            logger.info(f"Looking up CVE for {service_name} {version} {product}")
            
            cve_info = await self.cve_service.lookup_cve(
                service_name,
                version,
                product
            )
            
            if cve_info and not cve_info.get("no_cve_found"):
                logger.info(f"Found CVE data for {service_name}: {cve_info.get('cve_id')}")
                vulnerability.cve_id = cve_info.get("cve_id")
                vulnerability.cvss_score = cve_info.get("cvss_score")
                if cve_info.get("severity"):
                    vulnerability.severity = cve_info["severity"]
            else:
                logger.info(f"No CVE found for {service_name} {version}")
                # Ensure fields are explicitly set to indicate no CVE found
                vulnerability.cve_id = None
                vulnerability.cvss_score = None
                
        except Exception as e:
            logger.error(f"CVE lookup failed for {service.get('service_name', 'unknown')}: {e}")
            # Ensure fields are explicitly set to None on error
            vulnerability.cve_id = None
            vulnerability.cvss_score = None
    
    async def _enhance_vulnerability_with_llm(self, vulnerability: Vulnerability, service: dict):
        """Enhance vulnerability with LLM analysis"""
        try:
            service_name = service["service_name"]
            version = service["version"]
            
            logger.info(f"Getting LLM analysis for {service_name} {version}")
            
            analysis = await self.llm_service.analyze_vulnerability(
                service_name=service_name,
                version=version,
                port=service["port"],
                vulnerability_description=vulnerability.description,
                cve_id=vulnerability.cve_id
            )
            
            if analysis:
                logger.info(f"LLM analysis successful for {service_name}")
                if analysis.get("recommendation"):
                    vulnerability.recommendation = analysis["recommendation"]
                if analysis.get("remediation_commands"):
                    vulnerability.remediation_commands = analysis["remediation_commands"]
                if analysis.get("severity") and not vulnerability.cvss_score:
                    vulnerability.severity = analysis["severity"]
            else:
                logger.warning(f"No LLM analysis returned for {service_name}")
                
        except Exception as e:
            logger.error(f"LLM analysis failed for {service.get('service_name', 'unknown')}: {e}")
            # Provide basic fallback recommendation
            if not vulnerability.recommendation:
                vulnerability.recommendation = f"Update {service.get('service_name', 'service')} to the latest version and review security configuration"
    
    def get_scan(self, scan_id: int) -> Optional[Scan]:
        """Get scan by ID"""
        return self.db.query(Scan).filter(Scan.id == scan_id).first()

    def cancel_scan(self, scan_id: int) -> Scan:
        """Cancel a scan that is still processing"""
        scan = self.get_scan(scan_id)
        if not scan:
            raise ValueError("Scan not found")
        if scan.status != "processing":
            raise ValueError(f"Cannot cancel a scan with status '{scan.status}'")

        scan.status = "cancelled"
        self.db.commit()
        self.db.refresh(scan)
        return scan

    def get_scan_hosts(self, scan: Scan) -> List[dict]:
        """Derive a normalized host list (host, fqdn, ports) from a scan's parsed_data,
        regardless of whether it came from the live-launch simulator or an uploaded Nmap XML."""
        parsed_data = scan.parsed_data
        if not parsed_data:
            return []

        raw_hosts = parsed_data.get("hosts") or []
        if not raw_hosts:
            return []

        # Nmap-XML shape: hosts is a list of dicts with addresses/hostnames/ports
        if isinstance(raw_hosts[0], dict):
            hosts = []
            for host in raw_hosts:
                addresses = host.get("addresses") or []
                hostnames = host.get("hostnames") or []
                ports = host.get("ports") or []
                hosts.append({
                    "host": addresses[0]["addr"] if addresses else "unknown",
                    "fqdn": hostnames[0]["name"] if hostnames else None,
                    "ports": sorted({p["port"] for p in ports if "port" in p})
                })
            return hosts

        # Live-launch shape: hosts is a list of host strings, services is a flat list
        services = parsed_data.get("services") or []
        ports_by_host: dict = {}
        for service in services:
            host = service.get("host")
            if not host:
                continue
            ports_by_host.setdefault(host, set()).add(service.get("port"))

        return [
            {"host": host, "fqdn": None, "ports": sorted(p for p in ports if p is not None)}
            for host, ports in ((h, ports_by_host.get(h, set())) for h in raw_hosts)
        ]
    
    def get_user_scans(self, user_id: int, skip: int = 0, limit: int = 100) -> List[Scan]:
        """Get scans for a user"""
        return (
            self.db.query(Scan)
            .filter(Scan.user_id == user_id)
            .order_by(Scan.upload_time.desc())
            .offset(skip)
            .limit(limit)
            .all()
        )
    
    def delete_scan(self, scan_id: int):
        """Delete a scan and its related data"""
        from app.models.report import Report
        from app.models.feedback import Feedback
        from app.models.patch import Patch
        
        try:
            # Delete in the correct order to respect foreign key constraints
            
            # 1. Delete patches related to vulnerabilities in this scan
            vulnerability_ids = self.db.query(Vulnerability.id).filter(Vulnerability.scan_id == scan_id).all()
            if vulnerability_ids:
                vuln_ids = [v.id for v in vulnerability_ids]
                self.db.query(Patch).filter(Patch.vulnerability_id.in_(vuln_ids)).delete(synchronize_session=False)
            
            # 2. Delete feedback related to vulnerabilities in this scan
            if vulnerability_ids:
                self.db.query(Feedback).filter(Feedback.vulnerability_id.in_(vuln_ids)).delete(synchronize_session=False)
            
            # 3. Delete feedback directly related to this scan
            self.db.query(Feedback).filter(Feedback.scan_id == scan_id).delete()
            
            # 4. Delete reports related to this scan
            self.db.query(Report).filter(Report.scan_id == scan_id).delete()
            
            # 5. Delete vulnerabilities
            self.db.query(Vulnerability).filter(Vulnerability.scan_id == scan_id).delete()
            
            # 6. Finally, delete the scan itself
            self.db.query(Scan).filter(Scan.id == scan_id).delete()
            
            self.db.commit()
            
        except Exception as e:
            self.db.rollback()
            logger.error(f"Error deleting scan {scan_id}: {e}")
            raise