package fruitshopping.fruitshopping;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.scheduling.annotation.EnableAsync;

@SpringBootApplication
@EnableAsync
public class FruitshoppingApplication {

	public static void main(String[] args) {
		SpringApplication.run(FruitshoppingApplication.class, args);
	}

}
